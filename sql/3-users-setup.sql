DROP TYPE IF EXISTS user_fields;
DROP TYPE IF EXISTS user_sortable;
DROP FUNCTION IF EXISTS getUser;

/**
 * Optional columns that can be included with a getUser query.
 */
CREATE TYPE user_fields AS ENUM (
  'bio',
  'firstName',
  'lastName',
  'photoSmall',
  'photoFull',
  'followerCount',
  'followingCount'
);

/**
 * Columns that getUser can sort by. 
 * Can include columns not meant to be returned.
 */
CREATE TYPE user_sortable AS ENUM (
  'username',
  'firstName',
  'lastName',
  'followerCount',
  'followingCount'
);

CREATE FUNCTION get_user(
  -- Default values are defferred to declared variables because the function is called
  -- with prepared statements which need each parameter to be defined.
  -- But, pgtyped can't parse types if there isnt at least one default

  -- Queries
  q_id BIGINT,
  q_uid TEXT,
  q_follower_uid TEXT, -- Get users that follow the target user
  q_follows_uid TEXT,  -- Get users that the target user follows
  q_search_username TEXT,
  q_search_any TEXT,
  -- --
  sort_cols user_sortable[], -- Sort results by multiple fields. 
                                                        -- Sort columns don't need to be selected/picked.
  sort_dir sort_direction[], -- Sort direction. 'asc' | 'desc'
  result_limit BIGINT, -- Limit
  next_uid TEXT, -- Public unique ID of the last user in the prev. results
  fields user_fields[], -- Columns to query. Unpicked default to NULL.
  log_query BOOLEAN = FALSE -- Log the final SQL query for debugging
) RETURNS TABLE (
  id TEXT,
  username TEXT,
  bio TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "photoSmall" TEXT,
  "photoFull" TEXT,
  "followerCount" BIGINT,
  "followingCount" BIGINT
) LANGUAGE 'plpgsql' PARALLEL SAFE STABLE AS $$
DECLARE
  relation_map JSONB;	-- Possible relations components refer to. Relations are also dependencies for components.   
  column_map JSONB; -- Column definitions and their dependencies.
  dependencies TEXT[]; -- All component dependencies (relations). To be mapped to final relation set.
  next_relation TEXT; -- Specific relation for the next user query for paginated results.
  
  -- Final query components
  query_fields TEXT[]; -- (Aliased) columns. Order should match the return shape.
  relations TEXT[]; -- Relation set, in order of dependence.
  filters TEXT[]; 
  sorters TEXT[];
  limit_f BIGINT := COALESCE(result_limit, 50); -- Default query limit
  
  sql TEXT; -- Final query string
BEGIN
  relation_map := ('{
  "base": {
    "dependencies": [], 
    "relation": "users u"
  },		
  "followerCount": {
    "dependencies": ["base"],
    "relation": '|| to_json($r$ 
            LEFT JOIN LATERAL (SELECT count(*) as followers 
              FROM user_follows fr WHERE u.user_id = fr.user_id 
              GROUP BY user_id) fr ON TRUE
            $r$::TEXT) ||'
  },
  "followingCount": {
    "dependencies": ["base"],
    "relation": '|| to_json($r$ 
            LEFT JOIN LATERAL (SELECT count(*) as following 
              FROM user_follows fg WHERE u.user_id = fg.follower_id 
              GROUP BY follower_id) fg ON TRUE
            $r$::TEXT) ||'
  },
  "followers": {
    "dependencies": ["base"],
    "relation":	'|| to_json($r$
              LEFT JOIN user_follows followers 
                ON followers.follower_id = u.user_id 
            $r$::TEXT) ||'
  },
  "follows": {
    "dependencies": ["base"],
    "relation":	'|| to_json($r$
              LEFT JOIN user_follows follows 
                ON follows.user_id = u.user_id 
            $r$::TEXT) ||'

  }}')::JSONB;

  -- Include types to cast nulls to when a column isn't picked
  column_map := '{
    "id": {"query": "u.user_uid", "type": "text", "dependencies": ["base"]},
    "username": {"query": "u.username", "type": "text", "dependencies": ["base"]},
    "bio": {"query": "u.bio", "type": "text", "dependencies": ["base"]},
    "firstName": {"query": "u.first_name", "type": "text", "dependencies": ["base"]},
    "lastName": {"query": "u.last_name", "type": "text", "dependencies": ["base"]},
    "photoSmall": {"query": "u.photo_small", "type": "text", "dependencies": ["base"]},
    "photoFull": {"query": "u.photo_full", "type": "text", "dependencies": ["base"]},
    "followerCount": {"query": "COALESCE(fr.followers,0)", "type":"bigint", "dependencies": ["followerCount"]},
    "followingCount": {"query": "COALESCE(fg.following,0)", "type":"bigint", "dependencies": ["followingCount"]}
  }'::JSONB;

  -- ---------------------------------------------------------------------------
  --						               FIELDS/COLUMNS
  -- ---------------------------------------------------------------------------

  DECLARE 
    base_fields TEXT[]:= '{"id", "username"}';
    picked_fields TEXT[] := fields::TEXT[] || base_fields;
    sorted_fields TEXT[] := '{"id", "username", "bio", "firstName", "lastName", "photoSmall", "photoFull", "followerCount", "followingCount"}';
    
    -- Loop variables
    query TEXT;
    type TEXT;
    deps TEXT;
    key TEXT;
    
    -- Loop helpers
    curr_field_is_picked BOOLEAN;
    curr_field_query TEXT;
  BEGIN
    FOR  key, query, type, deps IN 
      SELECT f as key, v.query, v.type, v.deps 
      FROM unnest(sorted_fields) f
      LEFT JOIN LATERAL (SELECT x.query, x.type, x.dependencies as deps 
                  FROM jsonb_to_record(column_map -> f)
                  as x(query text, type text, dependencies text)) v ON TRUE 
    LOOP
      curr_field_is_picked := array_position(picked_fields, key) IS NOT NULL;
      curr_field_query := CASE WHEN curr_field_is_picked THEN query ELSE 'null' END;
      query_fields := query_fields || concat(curr_field_query, '::', type,' as ', quote_ident(key));
      
      -- Add dependencies for picked fields
      IF curr_field_is_picked THEN 
          DECLARE field_deps TEXT[]; 
        BEGIN
          SELECT convert_json_text_array(deps::JSON) INTO field_deps;
          dependencies := dependencies || field_deps;
        END;
      END IF;
    END LOOP;
  END;

  -- ---------------------------------------------------------------------------
  --						                  FILTERS
  -- ---------------------------------------------------------------------------

  DECLARE 
    filter_map JSONB;
    filter_deps TEXT[]; 
    
    -- User followers/follows query helpers
    query_follow_uid TEXT := COALESCE(q_follower_uid, q_follows_uid);
    query_follow_id BIGINT;
  BEGIN
    IF query_follow_uid IS NOT NULL THEN
      SELECT user_id INTO query_follow_id FROM users WHERE user_uid = query_follow_uid;
    END IF;

    filter_map := ('{
    "__id": {
      "pick": '|| (q_id IS NOT NULL) ||',
      "condition": "u.user_id = '|| quote_nullable(q_id) ||'",
      "dependencies": ["base"]
    },
    "id": {
      "pick": '|| (q_uid IS NOT NULL) ||',
      "condition": "u.user_uid = '|| quote_nullable(q_uid) ||'", 
      "dependencies": ["base"]
    },
    "username_search": {
      "pick": '|| (q_search_username IS NOT NULL) ||',
      "condition": "u.username ILIKE '|| quote_nullable('%'||q_search_username||'%') ||' ",
      "dependencies": ["base"]
    },
    "general_search": {
      "pick": '|| (q_search_any IS NOT NULL) ||',
      "condition": '|| to_json($c1$ 
                u.username || ' ' ||  COALESCE(u.first_name,'') 
                    || ' ' || COALESCE(u.last_name,'') ILIKE $c1$ 
                    || quote_nullable('%'||q_search_any||'%')
                )::TEXT ||',
      "dependencies": ["base"]
    },
    "followers": {
      "pick": '|| (q_follower_uid IS NOT NULL) ||',
      "condition": "followers.user_id = '|| quote_nullable(query_follow_id) ||'",
      "dependencies": ["followers"]
    },
    "follows": {
      "pick": '|| (q_follows_uid IS NOT NULL) ||',
      "condition": "follows.follower_id = '|| quote_nullable(query_follow_id) || '",
      "dependencies": ["follows"]
    }}')::JSONB;

    -- Pick filters and their dependencies
    SELECT 
      array_agg(condition), 
      array_agg((SELECT * FROM jsonb_array_elements_text(v.dependencies))) 
    FROM jsonb_each(filter_map) k 
    LEFT JOIN LATERAL (
      Select * from jsonb_to_record(k.value) as x(pick BOOLEAN, condition TEXT, dependencies JSONB)
    ) v ON TRUE
    WHERE v.pick
    INTO filters, filter_deps;

    dependencies := dependencies || filter_deps;	
  END;

  -- ---------------------------------------------------------------------------
  --					            SORTING AND PAGINATION(Next)
  -- ---------------------------------------------------------------------------

  DECLARE
    sort_map JSONB;
    sort_deps TEXT[];
    sort_col_count INT := COALESCE(array_length(sort_cols, 1), 0);
    curr_sort_col TEXT;
    curr_sort_query TEXT;
    curr_deps TEXT[];
    sort_relations TEXT[];
    curr_next_field_alias TEXT;
    sort_fields TEXT[];
    next_field_aliases TEXT[];
  BEGIN
    sort_map := ('{
      "id" : {
        "query": "u.user_id",
        "dependencies": ["base"]
      },
      "firstName" : {
        "query": '|| jsonb_extract_path(column_map, 'firstName', 'query')::TEXT  ||',
        "dependencies": '|| jsonb_extract_path(column_map, 'firstName', 'dependencies') ||'
      },
      "lastName": {
        "query": '|| jsonb_extract_path(column_map, 'lastName', 'query') ||',
        "dependencies": '|| jsonb_extract_path(column_map, 'lastName', 'dependencies') ||'
      },
      "username": {
        "query": '|| jsonb_extract_path(column_map, 'username', 'query') ||',
        "dependencies": '|| jsonb_extract_path(column_map, 'username', 'dependencies') ||'
      },
      "followerCount": {
        "query": '|| jsonb_extract_path(column_map, 'followerCount', 'query') ||',
        "dependencies":  '|| jsonb_extract_path(column_map, 'followerCount', 'dependencies') ||'
      },
      "followingCount": {
        "query": '|| jsonb_extract_path(column_map, 'followingCount', 'query') ||',
        "dependencies":  '|| jsonb_extract_path(column_map, 'followingCount', 'dependencies') ||'
      }
    }')::JSONB;

    FOR i IN 1..sort_col_count LOOP
      curr_sort_col := sort_cols[i]::TEXT;
      curr_sort_query := jsonb_extract_path_text(sort_map, curr_sort_col , 'query');
      sorters := sorters || concat_ws(' ', curr_sort_query, sort_dir[i]);
      SELECT convert_json_text_array(jsonb_extract_path(sort_map, curr_sort_col, 'dependencies')) INTO curr_deps;
      sort_deps := sort_deps || curr_deps;

      IF next_uid IS NOT NULL THEN 
        curr_next_field_alias := quote_ident('a' || i);
        next_field_aliases :=  next_field_aliases || curr_next_field_alias;
        sort_fields := sort_fields || curr_sort_query;
      END IF;
    END LOOP;

    sorters := sorters || '{u.user_uid asc}';

    IF next_uid IS NOT NULL THEN
      DECLARE
        curr_next_dir TEXT;
        curr_next_col TEXT;
        next_filters_arr TEXT[];
        closing_parens TEXT;
        next_filters TEXT;
        next_table_cols TEXT;
      BEGIN
      sort_deps := sort_deps || '{base}';
      SELECT resolve_dependencies(sort_deps, relation_map) INTO sort_relations;
      SELECT string_agg(concat_ws(' ',field,'as',alias), ', ') 
        FROM unnest(sort_fields) WITH ORDINALITY x(field,n)
        LEFT JOIN unnest(next_field_aliases) WITH ORDINALITY y(alias,m) ON x.n = y.m
        INTO next_table_cols;
      next_relation := 'LEFT JOIN (SELECT ' || next_table_cols ||
          ' FROM ' || array_to_string(sort_relations, ' ') ||
          ' WHERE u.user_uid = ' || quote_literal(next_uid) || ') next ON TRUE';

      FOR i IN 1..sort_col_count LOOP
        curr_sort_query := sort_fields[i];
        curr_next_dir := CASE sort_dir[i] WHEN 'asc' THEN '>' ELSE '<' END;
        curr_next_col := 'next.'|| next_field_aliases[i] ;
        next_filters_arr := next_filters_arr || (
          concat_ws(' ',curr_sort_query,curr_next_dir,curr_next_col) || ' OR ('
            || concat_ws(' ', curr_sort_query,'=', curr_next_col) || ' AND ('
        );
      END LOOP;
        closing_parens := array_to_string(array_fill(')'::TEXT, ARRAY[sort_col_count*2]), '');        
        next_filters := array_to_string(next_filters_arr,'') || 
          concat_ws(' ', 'u.user_uid >', quote_literal(next_uid), closing_parens);
        filters := filters || next_filters;
      END;
    END IF;

    dependencies := dependencies || sort_deps;
  END;

  -- ---------------------------------------------------------------------------
  --						                    QUERY
  -- ---------------------------------------------------------------------------

  SELECT resolve_dependencies(dependencies, relation_map) INTO relations;

  IF next_relation IS NOT NULL THEN 
    relations := relations || next_relation; 
  END IF;

  sql := 'SELECT '|| array_to_string(query_fields, ', ', '') ||
    ' FROM '|| array_to_string(relations, ' ', '') ||
    CASE WHEN filters IS NOT NULL THEN ' WHERE (' || array_to_string(filters, ') AND (', '') || ')' ELSE '' END ||
    CASE WHEN sorters IS NOT NULL THEN ' ORDER BY ' || array_to_string(sorters, ', ') ELSE '' END ||
    ' limit ' || limit_f;

  IF log_query THEN RAISE NOTICE ' %', sql; END IF;
  RETURN QUERY EXECUTE sql;
END $$;

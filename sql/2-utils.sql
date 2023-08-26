/**
 * Resolve and reduce an array of dependencies using a source relation map JSONB.
 * 
 * dependencies := {followers};
 * relations := {
 *    "base": {
 *      "dependencies": []
 *     },
 *     "followers": {
 *      "dependencies": ["base"]
 *     }
 * };
 *
 * resolved_dependencies := {base, followers};
 */
CREATE OR REPLACE FUNCTION resolve_dependencies(
	  dependencies TEXT[], 
	  relation_map JSONB
  ) 
	RETURNS TEXT[] IMMUTABLE PARALLEL SAFE
	LANGUAGE 'sql' AS $$
	
	WITH RECURSIVE 	base_deps AS (
		SELECT key as relation, deps
		FROM jsonb_each(relation_map) relation
		CROSS JOIN LATERAL jsonb_array_elements_text(relation.value -> 'dependencies') deps
	), dep_tree(deps, depth) AS (
		SELECT DISTINCT init_deps, 1
		FROM unnest(dependencies) init_deps		

		UNION

		SELECT bd.deps, dt.depth + 1
		FROM dep_tree dt
		LEFT JOIN base_deps bd ON dt.deps = bd.relation
		WHERE bd.relation IS NOT NULL
	) SELECT array_agg(body)
		FROM (SELECT deps FROM dep_tree GROUP BY deps ORDER BY MAX(depth) DESC) pr
		LEFT JOIN (SELECT key, value ->> 'relation' as body FROM jsonb_each(relation_map)) rel_body
			ON key = deps
$$;

DROP TYPE IF EXISTS sort_direction;
CREATE TYPE sort_direction as ENUM (
	'asc',
	'desc'
);

CREATE OR REPLACE FUNCTION convert_json_text_array(json) RETURNS TEXT[]
LANGUAGE 'sql' IMMUTABLE PARALLEL SAFE AS $$
SELECT array_agg(elements) FROM json_array_elements_text($1) elements;
$$;

CREATE FUNCTION convert_json_text_array(jsonb) RETURNS TEXT[]
LANGUAGE 'sql' IMMUTABLE PARALLEL SAFE AS $$
SELECT array_agg(elements) FROM jsonb_array_elements_text($1) elements;
$$;

/* @name get */
SELECT
 project_uid as "projectID",
 priority,
 description,
 name,
 skills,
 u.user_uid as "userID"
FROM projects p
LEFT JOIN users u ON p.user_id = u.user_id
WHERE (project_uid = :projectID OR :projectID IS NULL)
AND (u.user_uid = :userID OR :userID IS NULL);

/* @name insert */
INSERT INTO projects (
  project_uid,
  user_id,
  name,
  description,
  skills,
  priority
) VALUES (
  :projectID!,
  (SELECT user_id FROM users WHERE user_uid = :userID!),
  :name!,
  :description!,
  :skills!,
  :priority!
);

/* @name update */
UPDATE projects 
SET
  name = COALESCE(:name, name),
  description = COALESCE(:description, description),
  skills = COALESCE(:skills, skills),
  priority = COALESCE(:priority, priority)
WHERE project_uid = :projectID;

/* @name remove */
DELETE FROM projects WHERE project_uid = :projectID;

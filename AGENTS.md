# Repository workflow

## Updating templates

When the user says “aggiorna i template” (update the templates), perform this release workflow:

1. Pull the current branch of the main repository with `git pull --ff-only`.
2. Update every initialized submodule recursively with `git submodule foreach --recursive 'git pull --ff-only'`. Stop and report if a pull cannot fast-forward; do not discard local commits or changes.
3. Review the resulting repository and submodule status. Include all updated submodule pointers in the main repository release commit.
4. Increment the patch version in `package.json` without creating an automatic tag (for example, `npm version patch --no-git-tag-version`). Use the resulting `vX.Y.Z` as the release tag.
5. Commit the version change, this workflow file if changed, and all updated submodule pointers in the main repository.
6. Push the current branch to `origin`, create an annotated `vX.Y.Z` tag on the release commit, then push that tag to `origin`.
7. Verify that the branch and tag are present on `origin` and report the version, commit, and any submodules that could not be updated.

Do not push commits from the template submodule repositories; this workflow fetches their changes and records their updated commits in the main repository.

## Plugin installation regression tests

Whenever support for installing a plugin is added or changed, add or update regression tests for that plugin installation in the same change. Cover the generated dependencies and required template setup, including relevant combinations with existing plugins.

## Release checks

Whenever preparing a release, update the shadcn CLI dependency and its lockfile to the current version. Before releasing, quickly check that the latest commits on all branches configured in `.gitmodules` still work with the templates. The templates are deployed almost daily and already use `latest` for their dependencies, so this check should focus on compatibility with those current template commits.

Before every release, use GitHub to inspect the latest CI runs for each repository and branch in `.gitmodules`. Compare run commit SHAs with the branch heads. Report failed, missing, pending, or stale checks separately; do not treat an absent run as a passing build. Run `npm test` after updating templates, including the regression cases that use the actual template files.

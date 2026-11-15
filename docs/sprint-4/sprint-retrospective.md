# Sprint retrospective draft

This draft describes repository evidence. Team discussion and individual feedback
are to be completed by the team.

## What went well

Earlier work already covered most of the recovery workflow. The lifecycle SQL
preserves decisions and creates notifications in the same transaction. Existing
mobile and backend tests made focused integration changes easier to verify.

## Challenges and response

The mock match was unrelated to the lost item, and several asynchronous screens
could accept old responses. We replaced the sample pairing with a repeatable
category/title match and added request generations and regression coverage.
Session restoration also needed rejection and race handling. Upload validation
now checks actual bytes, rather than relying only on picker metadata.

The dependency review found a high advisory in a transitive lint dependency.
Its consumer supports the patched major version, so the lockfile was updated
without changing the Expo SDK. Other findings need upstream-compatible fixes.

## Improvements

Keep CI running on each PR, record scrum notes when meetings happen, and rehearse
with two real accounts in staging before the demo. Document hosted-service results
separately from offline fakes and local mock behavior.

## Outcome

Focused integration fixes and a repeatable mock demonstration are prepared.
Hosted acceptance, teammate review, course materials and final submission remain
team tasks. This draft does not claim those activities have happened.

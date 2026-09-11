# Changelog Resources

## Knowledge

- [Keep a Changelog 2.0.0](https://keepachangelog.com/en/2.0.0/)
  Primary convention for `CHANGELOG.md`: definition, six change types, Unreleased, structure, anti-patterns (git log as changelog). Use for: every lesson grounding; pin links to 2.0.0.
- [Keep a Changelog（中文）](https://keepachangelog.com/zh-CN/1.1.0/)
  Same convention in Chinese (currently mirrors 1.x wording). Use for: quick Chinese phrasing when drafting entries; verify against 2.0.0 English when guidance differs.
- [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html)
  Version number meaning (MAJOR.MINOR.PATCH). Use for: how Removed / breaking Changed usually map to majors; not required to adopt SemVer, but most projects pairing with Keep a Changelog do.
- [Common Changelog](https://common-changelog.org/)
  Stricter subset of Keep a Changelog (links to PRs/commits, imperative mood). Use for: later, if the user wants a tighter house style after mastering the base format.

## Wisdom (Communities)

- [The Changelog (podcast / news)](https://changelog.com/)
  Long-running software community; Olivier Lacan discussed Keep a Changelog origins here. Use for: hearing how maintainers talk about releases in the wild.
- [GitHub Discussions / project issues of repos you ship]
  Real consumers asking “what changed?” Use for: testing whether your entries answer the questions people actually ask.

## Gaps

- No single high-trust Chinese community dedicated to changelog craft; rely on Keep a Changelog zh + practice on own repos for now.

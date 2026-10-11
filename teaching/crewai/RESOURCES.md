# CrewAI Resources

## Knowledge

- [CrewAI Installation](https://docs.crewai.com/en/installation)
  Official install via `uv tool install crewai`; Python version constraints. Use for: environment setup before first lesson.
- [CrewAI Quickstart (Flows)](https://docs.crewai.com/en/quickstart)
  Official first Flow: state + one-agent crew → markdown report. Use for: recommended production-shaped entry path.
- [Build Your First Crew](https://docs.crewai.com/en/guides/crews/first-crew)
  Official two-agent JSON-first crew tutorial (`agents/*.jsonc`, `crew.jsonc`). Use for: Agent / Task / Crew mental model.
- [CrewAI Introduction](https://docs.crewai.com/en/introduction)
  Official overview: Flows = backbone (state, events, control flow), Crews = units of work inside a Flow; "for any production-ready application, start with a Flow". Use for: primary source of Lesson 0001.
- Concept pages (stable `/en/` URLs; they currently redirect to the versioned docs, v1.15.27 as of 2026-10-11):
  [Agents](https://docs.crewai.com/en/concepts/agents) ·
  [Tasks](https://docs.crewai.com/en/concepts/tasks) ·
  [Crews](https://docs.crewai.com/en/concepts/crews) ·
  [Processes](https://docs.crewai.com/en/concepts/processes) ·
  [Flows](https://docs.crewai.com/en/concepts/flows)
  Use for: field-level definitions (role/goal/backstory, description/expected_output/context, sequential vs hierarchical, @start/@listen/state).
- [Build Your First Flow](https://docs.crewai.com/en/guides/flows/first-flow)
  Official deeper Flow guide (routing, persistence). Use for: lesson after the Quickstart walkthrough.
- [CrewAI Docs home](https://docs.crewai.com/) · [llms.txt index](https://docs.crewai.com/llms.txt)
  Authoritative API and concept index; append `.md` to any page URL for raw markdown. Use for: verifying claims before teaching; never invent CrewAI APIs from memory.

## Wisdom (Communities)

- [CrewAI GitHub Discussions / Issues](https://github.com/crewAIInc/crewAI)
  Upstream product + bug signal. Use for: version breaks, CLI changes, “is this still the recommended API?”
- [CrewAI Community Forum](https://community.crewai.com)
  Official forum (linked from the docs nav and Quickstart "Join the Community"). Use for: real-world patterns after basics; skip if user opts out of communities.
  (Removed the old Discord invite `discord.com/invite/X4JWnZnxS7`: Discord API returned "Unknown Invite" on 2026-10-11.)

## Gaps

- Need a high-trust comparison of CrewAI vs LangGraph / AutoGen / OpenAI Agents for “when to pick CrewAI” once mission is known.
- Memory / long-running agent patterns in CrewAI may need a separate curated paper or official memory docs pass after mission lock.

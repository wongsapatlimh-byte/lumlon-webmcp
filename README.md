# LUMLON — an agent-ready air & hazard companion for Thailand

A [WebMCP](https://developer.chrome.com/docs/ai/webmcp) demo built for the **OpenAI WebMCP Challenge**.

Agents shouldn't just book tables. Ask one whether it's safe to take your kids to the park in Chiang Mai
tomorrow morning, and it can read the same live air quality and official hazard alerts you see on the page —
then set a watch that warns you when a reading crosses your threshold.

**Live demo:** <https://lumlon-webmcp.vercel.app>
**Coverage:** Thailand, all 77 provinces.
**Browser:** the ChatGPT desktop app browser, or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.

---

## Quick test (3 steps)

1. Open the live URL in **the ChatGPT desktop app browser**, or in **Chrome 149+** with
   `chrome://flags/#enable-webmcp-testing` set to *Enabled* (relaunch after changing it).
2. Open the **Site tools** panel. Six tools should be listed.
3. Copy one of the suggested prompts from the bar at the bottom left and send it. **The page updates as the
   agent works** — that's the point of the demo.

If your browser doesn't support WebMCP, the site still works as an ordinary web page and tells you how to
enable it. Nothing breaks.

### Suggested prompts

- *I'm traveling to Chiang Mai next week — is the air safe for a morning run?*
- *Compare the air in Bangkok and Chiang Mai right now.*
- *Are there any official hazard alerts in effect around Phuket today?*
- *Watch PM2.5 in Bangkok and warn me if it goes above 75.*
- *What am I currently watching, and can you remove the Bangkok one?*

---

## The tools

| Tool | What it does | Kind |
|---|---|---|
| `search_locations` | Turn a place name into a province code. Thai or English, loose spelling. | read |
| `get_environment_snapshot` | Air quality, short forecast, and official hazard alerts — each alert carries its own `expires`, because they come from a dated snapshot. | read |
| `get_safety_briefing` | Decide whether an activity is advisable **and explain why**, quoting the real readings. | read |
| `create_watch` | Save a rule that warns when a reading crosses a threshold. | **write** |
| `list_watches` | List the rules saved in this browser. | read |
| `delete_watch` | Remove one rule. | **destructive** |

Three things we did deliberately, because they're what makes an agent integration usable rather than just
present:

- **Every block of data carries the time it was observed and the source it came from.** A number without a
  timestamp is a number nobody can check — and the person hearing the agent's answer can't see the screen.
- **Missing data is reported, never hidden.** If the hazard feed can't be read, the answer says so. "Could not
  read" and "no alerts" are different facts, and collapsing them is the most dangerous thing a safety tool can
  do. For the same reason, a briefing never says *good* while something it needed was unavailable — missing
  data can lower our confidence, but it never lowers a warning.
- **Write tools are annotated as write tools**, so ChatGPT's own confirmation step fires before anything is
  saved or deleted. `delete_watch` is marked destructive.

---

## Prior work vs Challenge work

This project existed before the challenge. The git history here is arranged so you can see exactly where the
line is, without taking our word for it:

| Commit | What it is |
|---|---|
| **1st commit** — *import prior work this demo builds on* | The pre-existing code this demo reuses, taken **as it stood before any WebMCP work began**. No `src/webmcp/` directory exists in this commit. |
| **2nd commit** — *WebMCP tools built for the OpenAI WebMCP Challenge* | **Everything built for the challenge.** Its diff is the complete set of lines added, including the handful of lines added to pre-existing shared files. |
| _(no later commits)_ | See the note below — this history is regenerated, not appended to. |

**How this history is produced, precisely.** This repository is written by an export script that runs against
the private repository and rebuilds these two commits from scratch each time it publishes. So what you are
looking at is a **two-layer snapshot**, not a running log: there is no third commit, and re-publishing replaces
the two you see rather than adding to them. The day-by-day history lives in the private repository, where the
work actually happened.

We are spelling that out because the alternative — a commit list that *looks* like a daily log but was
generated in one go at publish time — would imply something the repository cannot back up. What this history
can prove is the thing the rules actually ask for: **a clean line between the code that existed before, and
every line added for this challenge.** The first commit contains no `src/webmcp/` directory at all; the second
commit's diff is the complete set of challenge work, including the handful of lines added to pre-existing
shared files. That boundary is checkable by anyone reading the diff, and it does not depend on trusting us.

**One thing to be straight about:** this repository is a **subset export** of a larger private application, not
the whole product. Everything needed to run and audit the demo is here; the parts that are not (accounts,
payments, the admin console, our own backend) are deliberately excluded, and the demo genuinely does not use
them. So the first commit is *"the prior work this demo stands on"*, not *"the entire app"* — we'd rather say
that plainly than let the history imply something it doesn't show.

Challenge work began on **29 August 2026**. Nothing has been backdated: the second commit carries the date it
was exported, which is a real working day on this project, and it is never set to a date earlier than the work.

**What counts as prior work here:** the Next.js application shell, the design system, the i18n dictionary, the
province registry client, and the hazard-alert client (built by the team's map lane earlier in August).

**What was built for the challenge:** the entire `src/webmcp/` module — tool definitions and their guard rails,
the data-provider layer, the browser watch engine, the UI bridge that keeps the page in sync with the agent,
the agent bar, and this demo's own landing page and data route.

---

## Run it from a clean clone

Requires Node 24.x.

```bash
npm ci
NEXT_PUBLIC_WEBMCP_ENABLED=1 npm run build
npm start
```

In PowerShell:

```powershell
npm ci
$env:NEXT_PUBLIC_WEBMCP_ENABLED = '1'
npm run build
npm start
```

Then open <http://localhost:3000>. No API keys are required — the weather upstream used here needs none, and
the demo has no database and no accounts.

> **The `NEXT_PUBLIC_WEBMCP_ENABLED=1` is not optional for a build.** The flag defaults to `0`, and with it off
> the WebMCP module is dropped from the bundle entirely — the page still renders, but no tools are registered
> and nothing is offered to an agent. That default is deliberate: it is what keeps the module out of unrelated
> builds, and `npm run webmcp:scan` is the check that proves it.

For development with WebMCP enabled:

```bash
NEXT_PUBLIC_WEBMCP_ENABLED=1 npm run dev
```

Useful checks:

```bash
npm test              # unit and integration tests
npm run webmcp:scan   # proves the module leaves no code in the build when the flag is off
```

### Configuration: switching data sources

Both upstream sources are chosen by environment variable, so either can be pointed at a different upstream, or
taken off the network entirely, **without touching code**. That matters here: once judging opens, this submission is frozen, and "we had to edit a file"
is not an option we want to need.

| Variable | Accepted values | Default |
|---|---|---|
| `WEBMCP_AIR_SOURCE` | `open-meteo` · `openaq` · `bundled` | `open-meteo` |
| `WEBMCP_FORECAST_SOURCE` | `open-meteo` · `bundled` | `open-meteo` |

- **`bundled`** answers from the snapshot that ships in this repository. Every value it returns is labelled
  `cached: true`, and the response says in words that the deployment is configured this way — which is a
  different sentence from the one we use when an upstream simply could not be read. Waiting fixes one of those
  and not the other, so they must not share wording.
- **`openaq`** is *registered but not connected*. It needs an API key we have not been issued, and we will not
  write a client against a response shape we have not seen with our own eyes. Selecting it returns **no
  numbers** and a `gap` that says why — it does **not** quietly fall back to anything, because that would let
  an operator believe a source is working when it is not.
- **An unrecognised value is an error, not a fallback.** Somebody who types `open_meteo` is trying to switch
  Open-Meteo *off*; silently leaving it on would do the exact opposite of what they asked, with no signal.

Switching a source off never fails the whole answer. The remaining block and the hazard alerts still respond,
and whatever is missing shows up in `gaps` with a reason an agent can read aloud.

---

## What this demo intentionally does **not** do

Being explicit about this is part of the design, not a disclaimer:

- **No sign-in and no accounts.** Judges should be able to use everything immediately.
- **Watches run in this browser only, and only while the page is open.** They are evaluated against live
  data in that page. LUMLON's LINE channel can answer weather and forecast questions, but this demo sends no
  watch or hazard alerts through LINE.
- **Nothing is stored on a server.** There is no database.
- **Hazard alerts are a dated snapshot,** captured from the official feed and labelled as cached with its
  capture time — see [Why the hazard alerts are a dated snapshot](#why-the-hazard-alerts-are-a-dated-snapshot)
  below. Air quality and the forecast are live on every request by default — see
  [Configuration: switching data sources](#configuration-switching-data-sources).

---

## Why the hazard alerts are a dated snapshot

LUMLON is a real product being built for launch — not something assembled for this challenge. In the product,
the hazard layer reads the official feed live, through our own backend. This entry deliberately does not, and
it is worth being specific about why, because "we used a snapshot" can mean anything from a careful decision
to a shortcut nobody wanted to admit to.

1. **That layer is under active development right now.** A frozen competition entry pointed at a service we
   are still changing would let our own work break a judge's experience without us noticing — and we would not
   find out until someone told us, after judging.
2. **This entry is frozen once judging opens and cannot be redeployed.** Anything it depends on has to be
   something that cannot go down. Our own staging backend is not that.
3. **The snapshot is honest in a way a live-but-flaky feed would not be.** A dated capture that says it is a
   dated capture is checkable. A feed that silently returns nothing looks identical to "there are no alerts",
   and those are not the same fact.

What that means in practice: the alerts here come from a capture of the official Thai Meteorological
Department CAP feed taken on a stated date. Every answer that uses them is labelled `cached` and carries that
capture time. Nothing on the page, and nothing an agent reads, presents them as current.

The live path is not hypothetical — it is the same provider interface this demo uses, pointed at our backend
instead of at the bundled data, and it works. The product simply is not open to the public yet, so we cannot
point you at it to verify that for yourself. We would rather say so plainly than imply a link we cannot give
you.

---

## Data sources and credits

- **Air quality and forecast** — [Open-Meteo](https://open-meteo.com/), data licensed
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Official hazard alerts** — Thai Meteorological Department, CAP feed (public domain), used here as a
  dated snapshot ([why](#why-the-hazard-alerts-are-a-dated-snapshot)).
- **Province registry** — LUMLON, derived from the official 77-province list.

---

## License

Code in this repository is released under the **MIT License** — see [LICENSE](LICENSE).

**Trademark notice:** the name and logo **LUMLON** are trademarks of their owner and are **not** covered by the
MIT license. Opening the source does not grant rights to the brand.

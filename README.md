# OOP All-in-One: Python, C++ and JavaScript

[![CI](https://github.com/KushalranaAI/OOP-All-In-One/actions/workflows/ci.yml/badge.svg)](https://github.com/KushalranaAI/OOP-All-In-One/actions/workflows/ci.yml)

**[Open the hosted copy →](https://kushalranaai.github.io/OOP-All-In-One/)** (read-only: Run shows each program's expected output. Clone the repo to run code.)

**An interactive local website that teaches object-oriented programming in three languages side by side.** It
covers the prerequisite basics, how an object is actually born in memory, and every core OOP idea with diagrams you
can step through. It ends with five projects you build step by step. Every program has a ▶ Run button.

```
① Basics (prerequisites)      Python · C++ · JavaScript - 6 lessons each
② OOP concepts                11 chapters, each explained in all three languages
③ Projects                    5 step-by-step builds, each written in all three languages
```

## Start: one command

```bash
git clone https://github.com/KushalranaAI/OOP-in-Python.git
cd OOP-in-Python
python -m venv .venv && source .venv/bin/activate        # Windows: .venv\Scripts\activate
python start.py
```

`start.py` installs Flask, Markdown and PyYAML if they're missing, starts the site at **http://127.0.0.1:5070** and
opens your browser. Use `python start.py --port 8000 --no-browser` to change that.

**Auto-reload.** While it runs, edit anything and open pages refresh by themselves: content, templates, CSS and JS are
re-read on the spot, and a change to a `.py` file restarts the server first. Turn it off with `--no-reload`.

| To run… | you need | without it |
|---|---|---|
| Python examples | nothing extra | - |
| JavaScript examples | [Node.js](https://nodejs.org) on your PATH | the expected output is shown instead |
| C++ examples | `g++` or `clang++` with C++20 support (GCC 10+, Clang 12+; on Windows: MSYS2/MinGW or WSL) | the expected output is shown instead |

The site only listens on `127.0.0.1`. Its Run buttons execute code on your machine, so the run API also requires a
per-session token and rejects requests from other origins.

## Pick your language
A switch at the top of every page shows **Py**, **C++**, **JS**, or **All** three side by side.
Your choice is remembered. Learn one language, or compare how the same idea looks in each.

## The app
It shares its design system with [ML 1 → 100](https://github.com/KushalranaAI/machine-learning-1-to-100) and System Learn:
the same tokens, sidebar, cards and progress rings.

- **Dashboard**: overall progress ring, stats (pages done, time invested, day streak, projects), *Up next* that
  follows you through the course, and the roadmap of basics, concepts and projects.
- **Sidebar**: every track with a progress ring and a done / in progress / new marker on each page.
- **Search**: <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>/</kbd>) jumps to any lesson, concept, project or tool.
- **Lessons**: an *On this page* contents that tracks where you are, a quiz with a score, and **Mark as understood**,
  which suggests the next page.
- **Projects**: tick off each step as you build it. The ring shows how far through you are.
- **My progress**: an 18-week activity heatmap, streaks, progress by part, recent completions, and export / import /
  reset. Progress is stored only in your browser.
- **Code**: dark code blocks with Copy and Run, an exit status and timing on every run, and editors with
  <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run.
- **Light, dark or match system** (button in the top bar), works on phones, keyboard friendly, and respects reduced motion.

### AI tutor (optional, bring your own)
Press **Ask AI** or <kbd>Ctrl</kbd> + <kbd>/</kbd>. The tutor sees the page you're on, in the language you picked.
Highlight any text, press **Explain** on a code block, or press **Explain this error** when a program fails. Each page
keeps its own conversation, and quick prompts suggest questions such as *What happens in memory?* and *Compare the 3 languages*.

- **Keys in `.env` (local app only):** copy [`.env.example`](.env.example) to `.env` and fill in `OPENAI_API_KEY`,
  `ANTHROPIC_API_KEY` and/or the three `AZURE_OPENAI_*` values. No restart needed. The local server attaches the key
  to each request ([app/ai_relay.py](app/ai_relay.py)). The browser never receives it, and keys are removed from
  provider error messages. The relay only answers this machine's own pages. `.env` is git-ignored.
- **Local and private:** [Ollama](https://ollama.com) (`ollama pull llama3.2`), LM Studio or any OpenAI-compatible
  server on `localhost`.
- **Cloud with your own key:** Claude, OpenAI or Gemini. A key typed in AI settings is encrypted with a non-extractable
  browser key and stored on this device or for this session only. It is sent only to the provider you picked.
- **Hosted copy:** works with Ollama, Claude, OpenAI and Gemini. Keys from `.env` and Azure OpenAI need the local app.

## What's inside

### ① Basics: the prerequisites
| Python | C++ | JavaScript |
|---|---|---|
| Running Python, variables and types | Compiling, variables and types | Running JS, let/const, types |
| Control flow | Control flow | Control flow and `===` |
| Functions | Functions, references and const | Functions and closures |
| Lists, tuples, dicts and sets | Pointers, memory and smart pointers | Arrays, objects, Map and Set |
| Strings and exceptions | Strings and standard containers | Strings and errors |
| Modules, files and type hints | Structs, headers and exceptions | Modules and async/await |

### ② OOP concepts
| # | Chapter | Interactive |
|---|---|---|
| 1 | Why object-oriented programming? | procedural vs OOP diagrams |
| 2 | Classes and objects: how an object is born | **step-through memory trace** of `Dog("Rex", 3)` / `new Dog(...)` in each language |
| 3 | Attributes, methods, `self` and `this` | trace of how `self`/`this` is bound |
| 4 | Encapsulation and access control | access-rule explorer (public/protected/private, `_x`, `#x`) |
| 5 | Constructors, destructors and object lifecycle | trace of construction → use → destruction (RAII, GC, `with`) |
| 6 | Inheritance | **diamond explorer**: Python's C3 MRO vs C++ vs JS |
| 7 | Polymorphism and dynamic dispatch | **method-lookup explorer**: MRO, prototype chain, C++ vtable |
| 8 | Abstraction, abstract classes and interfaces | **class builder**: design a class, get the code in 3 languages + a UML diagram |
| 9 | Composition over inheritance | strategy/has-a diagrams |
| 10 | Special methods and operator overloading | dunder methods vs C++ operators vs JS symbols |
| 11 | SOLID principles and design patterns | Strategy, Observer, Factory |

Every chapter has the idea with diagrams, a section per language, a runnable example per language, a comparison
table and a short quiz. The **Compare** page collects every comparison row in one place, and the **Playground** is a
scratch editor for all three languages.

### ③ Projects: build them step by step
| # | Project | Level | You practise |
|---|---|---|---|
| 1 | 🏦 Bank account system | Beginner | encapsulation, custom exceptions, inheritance, composition |
| 2 | 🔷 Shape hierarchy and canvas | Beginner | abstract classes, polymorphism, operators, a factory |
| 3 | 📚 Library catalogue and loans | Intermediate | polymorphic rules, composition over inheritance, observer |
| 4 | 🅿️ Parking lot system | Intermediate | best-fit allocation via polymorphism, strategy pattern, facade |
| 5 | ⚔️ Turn-based RPG battle | Advanced | template method, command and observer patterns, status effects, dependency injection |

Each project page has the requirements, a UML class diagram, a numbered build guide (each step explains *why* and
shows that step's code in your language), and the complete runnable program. All three implementations of a project
print exactly the same output, which the tests check.

## Repository layout
```
start.py                one-command launcher
app/                    Flask app: content loader, code runner, AI relay, brand.py, templates, static JS/CSS, widgets/
content/basics/<lang>/  prerequisite lessons (Markdown)
content/concepts/NN-*/  index.md + python.md + cpp.md + javascript.md + example.{py,cpp,js} (+ .out)
content/projects/NN-*/  README.md (requirements, design, steps) + python/ cpp/ javascript/ main files (+ .out)
content/traces/         step-by-step memory traces (generated by scripts/build_traces.py)
scripts/build_pages.py  builds the static GitHub Pages copy into site/ and checks its links
tests/                  pytest: content checks, every program's real output, pages, run-API guards, static build
.github/                CI workflow, protect-main ruleset, CODEOWNERS, pull request template
```

**Adding content.** Code fences tagged `python`, `cpp` or `javascript` are complete programs and get a Run button.
Fragments use `py`, `c++` or `js`. In projects, `# ── Step N ──` / `// ── Step N ──` comments split the complete
program into the code shown for each step, so step code and the full program can never drift apart.

## Tests
```bash
pip install -r requirements.txt
pytest -q
```
The tests run every example, every project in every language, and every runnable code block, and compare them with
the stored outputs. Languages without an installed toolchain are skipped.

## Hosted copy and CI
Every push and pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Check | What it does |
|---|---|
| `test` | `pytest`: content checks, every example and project in Python, C++ (g++) and JavaScript (Node) against its stored output, pages, run-API guards |
| `pages` | `python scripts/build_pages.py`: renders every page into `site/` as a static copy and fails on any broken internal link |
| `deploy` | on `main` only, after both pass: publishes `site/` to GitHub Pages |

To build the hosted copy yourself: `python scripts/build_pages.py --base /OOP-All-In-One`. In Git Bash on Windows, prefix
the command with `MSYS_NO_PATHCONV=1`.

One-time setup on GitHub:
1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Rules → Rulesets → New ruleset → Import a ruleset**, and choose
   [`.github/rulesets/protect-main.json`](.github/rulesets/protect-main.json). It blocks force-pushes and deletion of
   `main`, requires a pull request with a code-owner review, and requires the `test` and `pages` checks to pass.
   Repository admins can bypass it.

## License
MIT. See [LICENSE](LICENSE).

---
Built by **Kushal Rana**: [Portfolio](https://kushalranaai.github.io/) · [LinkedIn](https://www.linkedin.com/in/kushal-rana) ·
[YouTube](https://www.youtube.com/@naaku-o2x) · [X](https://x.com/KushalranaAI) · [Medium](https://kushalrana448.medium.com/)

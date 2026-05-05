---
builds:
  Security & Red/Blue Team:
    - name: Vyrox Security
      link: https://vyrox.dev
      desc: Memory-safe, autonomous AI SOC infrastructure for deterministic threat investigation.
      icon: i-ph:shield-check-duotone
      tech:
        - i-logos:rust
        - i-logos:python
      repo: vyrox
  Open Source Contributions:
    - name: Dora-rs - Metadata::get_or
      link: https://github.com/dora-rs/dora/pull/1400
      desc: Added Metadata::get_or for cleaner parameter access with defaults, reducing boilerplate and improving ergonomics in dora-rs.
      icon: i-ph:git-pull-request-duotone
      tech:
        - i-logos:rust
      repo: dora-rs/dora
    - name: Rust Clippy - useless_conversion lint
      link: https://github.com/rust-lang/rust-clippy/pull/16238
      desc: Enhanced .into_iter() suggestions for nested references, fixing over-borrowed code patterns in the official Rust linter.
      icon: i-ph:git-merge-duotone
      tech:
        - i-logos:rust
  Solana / On-chain:
    - name: Time Capsule Protocol
      link: https://time-capsule-protocol.vercel.app
      desc: "Trustless time-locking: encrypt now, auto-reveal later-no intermediaries."
      icon: i-ph:lock-key-duotone
      tech:
        - i-simple-icons:solana
        - i-logos:rust
        - i-carbon:time
      repo: keirsalterego/tc-protocol
    - name: ScholrLink
      link: https://scholr-link.vercel.app
      desc: "Social articles become one-tap Solana funding portals with Blinks and soulbound patron badges."
      icon: i-ph:graduation-cap-duotone
      tech:
        - i-simple-icons:solana
        - i-logos:rust
        - i-simple-icons:nextdotjs
      repo: keirsalterego/scholr.link
  Systems Tools:
    - name: DedCore
      link: https://dedcore.live
      desc: A high-performance file deduplication tool with TUI, featuring multi-algorithm hashing and smart filtering.
      icon: i-ph:copy-duotone
      tech:
        - i-logos:rust
      repo: keirsalterego/dedcore

    - name: RustyTasks
      link: https://github.com/keirsalterego/rustytasks
      desc: Conquer your tasks with ruthless efficiency using this command-line powerhouse.
      icon: i-ph:check-square-offset-duotone
      tech:
        - i-logos:rust
        - i-logos:mongodb
    - name: RustyKeir
      link: https://github.com/keirsalterego/rustykeir
      desc: Keir Lang, Because 9000 programming languages just weren't enough.
      tech:
        - i-logos:rust
      icon: i-ph:code-duotone
---

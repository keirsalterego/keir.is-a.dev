---
title: "Rewriting Our C2 Caching Layer in Rust (And Losing My Mind)"
tags: ["Red Team", "Rust", "Systems", "C2"]
---

About a month ago, the telemetry on a custom Red Team C2 (Command and Control) infrastructure I was building started showing latency spikes. The culprit? Our Python-based payload delivery cache was taking a leisurely 15 milliseconds to return obfuscated shellcode to the implants. 

In the world of stealthy execution, 15 milliseconds is an eternity. Blue teams have caught beacons for less. If your team server stutters while serving a staging payload, modern EDRs start asking questions.

I decided it was time to rewrite the caching layer in Rust. How hard could a stealthy LRU cache be?

### The Naive Implementation

I started by implementing a doubly-linked list backed by a `HashMap`, exactly like you learn in an undergraduate Data Structures class. I figured this would efficiently track the most recently requested shellcode artifacts without excessive memory overhead.

```rust
struct PayloadCache<K, V> {
    capacity: usize,
    map: HashMap<K, NodePtr<K, V>>,
    head: Option<NodePtr<K, V>>,
    tail: Option<NodePtr<K, V>>,
}
```

The Rust compiler looked at this design and immediately laughed in my face. Trying to safely manage self-referential structs and multiple mutable pointers to the same node in safe Rust is like trying to convince a cat to take a bath.

I spent six hours trying to appease the borrow checker with `Rc<RefCell<T>>`. Eventually, the overhead of atomic reference counting and the runtime borrow checking completely destroyed the performance benefits I was trying to achieve. The jitter on our beacons was literally increasing because of my garbage code.

### The Realization

After questioning my life choices, I benchmarked my overly complicated, `unsafe`-laden linked list against a standard `BTreeMap` paired with a simple monotonic counter to track payload access times.

The `BTreeMap` was 3x faster. 

I had spent an entire weekend fighting pointers for a data structure that was easily outperformed by the standard library out of the box. Modern CPU caching vastly prefers contiguous memory over jumping randomly around the heap.

### The Lesson

We shipped the `BTreeMap` implementation. Staging payload delivery latency dropped from 15ms to 800 microseconds. The implants receive their instructions so fast that network analysis tools barely register the transaction before the socket is closed.

The biggest lesson I learned? The borrow checker isn't just protecting you from segfaults. Sometimes, it's protecting you from your own over-engineered architecture. If safe Rust makes a pattern incredibly difficult to write, it's usually the CPU's way of telling you that you are destroying its L1 cache.

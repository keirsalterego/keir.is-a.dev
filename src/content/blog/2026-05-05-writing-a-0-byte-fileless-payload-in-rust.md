---
title: "Writing a 0-byte Fileless Payload in Rust"
tags: ["Rust","Security","Malware"]
---

Last night, I was analyzing how modern EDRs hook into standard `ntdll.dll` syscalls to catch process injection. 

Most vendors just hook `NtWriteVirtualMemory` and call it a day. But what if we don't write any memory at all? What if we just use existing memory in the target process?

## The Theory
Instead of injecting our shellcode, we find a code cave in a running legitimate process (like `explorer.exe`), map our payload as a shared section, and execute it via a hijacked thread. 

```rust
fn execute_payload(target_pid: u32) {
    let process = open_process(target_pid);
    let cave = find_code_cave(process, 4096);
    
    // The magic happens here. We don't allocate.
    // We just borrow the memory permanently.
    hijack_thread_and_run(cave);
}
```
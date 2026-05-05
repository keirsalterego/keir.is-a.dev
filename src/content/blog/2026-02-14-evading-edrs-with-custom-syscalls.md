---
title: "Evading EDRs with Custom Syscalls in Rust"
tags: ["Red Team", "Security", "Rust", "Systems"]
---

Modern Endpoint Detection and Response (EDR) solutions are incredibly aggressive. If you so much as look at `VirtualAllocEx` or `CreateRemoteThread` in Windows, you will immediately have five different security analysts staring at your process tree.

A common technique to bypass user-land hooking is direct system calls. This involves manually executing the `syscall` assembly instruction rather than relying on `ntdll.dll`, thus blinding the EDR components hooked into the standard Windows APIs.

While C and C++ are the traditional tools for this, writing custom syscalls in Rust is not only entirely possible, it's weirdly enjoyable.

### The Problem with C

In C, writing a direct syscall wrapper looks something like this:

```c
EXTERN_C NTSTATUS SysNtAllocateVirtualMemory(
    HANDLE ProcessHandle,
    PVOID *BaseAddress,
    ULONG_PTR ZeroBits,
    PSIZE_T RegionSize,
    ULONG AllocationType,
    ULONG Protect
);
```

You then link an assembly file (`.asm`) containing the syscall stubs. It works, but managing the build pipeline, the MSVC compiler flags, and the architectural differences across Windows builds is incredibly tedious. 

### Enter `core::arch::asm!`

Rust’s inline assembly macros allow you to embed the `syscall` instruction directly inside your functions. No external `.asm` files. No complex build scripts. Just pure, unadulterated system-level chaos safely encapsulated in a compiled binary.

```rust
use std::arch::asm;

#[inline(never)]
pub unsafe fn do_syscall(ssn: u32, args: *const u64) -> u32 {
    let mut status: u32;
    asm!(
        "mov r10, rcx",
        "mov eax, {ssn:e}",
        "syscall",
        ssn = in(reg) ssn,
        out("eax") status,
        options(nostack)
    );
    status
}
```

This tiny snippet bypasses almost every user-land API hook on modern Windows machines. You extract the System Service Number (SSN) dynamically from the kernel at runtime (often by parsing the PE headers of a fresh `ntdll.dll` loaded from disk), and feed it directly to the CPU.

### Why Rust for Red Teaming?

The real power isn't just the inline assembly—it's the ecosystem. 

When writing implants in C++, memory corruption is a feature, not a bug. Your stealthy payload might evade CrowdStrike perfectly, only to crash the target machine with a segfault because you mismanaged an array index, immediately alerting the SOC that something went terribly wrong.

With Rust, if the code compiles, the payload is memory safe. The C2 infrastructure runs perfectly, the payload executes deterministically, and the Blue Team is none the wiser. 

Just remember: never use `.unwrap()` in an implant unless you really want to leave a nice panic backtrace for the forensics team.

---
title: Enum Type Safety in C
author: JP Hutchins
date: 2024-12-16
preview: |
  C enums can guarantee exhaustive pattern matching at compile time.
---

The C standard allows the programmer to define new types, including enumerated types—or "enums"—that improve program readability and type safety. This article explores the specification for enumerated types, the compiler options that improve enum type safety, and why type safety prevents run time errors. The focus is on the GCC and Clang C compilers targeting ARM32 (e.g. Cortex-M MCUs), but the same conclusions should apply to all C targets, including RISCV, x86_64, and ARM64.

## Table of Contents

## C Enums

C enums enable the definition of new types that are collections of symbols. Each symbol is mapped to an integer value. The integer value may be arbitrary or it may be a useful part of the representation.

For example, an enumeration of **colors** might look like this:
```c
enum color {
	COLOR_RED = 0,
	COLOR_GREEN = 1,
	COLOR_BLUE = 2,
};
```
The value of 0 being given to red, 1 to green, and 2 to blue is _arbitrary_—the values used could be any set of three numbers. Because the use of unique integers with arbitrary values is so common, an enum member definition that does not include the value will automatically be assigned the preceding value plus one:

```c
enum color {
	COLOR_RED = 0,
	COLOR_GREEN,  // automatically 1
	COLOR_BLUE,  // automatically 2
};
```

This is simpler, and in the case where new symbols may appear anywhere in the definition, it is _preferred_, because it will prevent accidental creation of shared values when unique values are required.

On the other hand, an enumeration of **speed limits** may map to constant integer values that are useful and not-at-all arbitrary:
```c
enum speed_limit {
	SPEED_LIMIT_30_KPH = 30,
	SPEED_LIMIT_60_KPH = 60
	SPEED_LIMIT_90_KPH = 90,
};
```

Lastly, the enumerated values do not need to be unique. Multiple symbols can map to the same literal integer, though the intent is often more clear by mapping to the symbol rather than the literal integer:
```c
enum font {
	FONT_TIMES_NEW_ROMAN = 0,
	FONT_HELVETICA,
	FONT_DEFAULT = FONT_HELVETICA,  // instead of 1
};
```

_All of the examples "namespace" the enum by prefixing members with the name of the type—the name of the collection—as is common practice in C because the type itself cannot be used as the namespace. That is, it's not possible to use `enum color::RED`. Don't dismay! More sophisticated strategies to enforce type safety are the subject of this very article._

### The C Standard

The C standard states that enumerated types (enums) that are defined by the programmer are unique types.

In the draft version ([ISO/IEC 9899:2024 (en) — N3220](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf)) of C23, we find a definition for C enumerations:

> An enumeration comprises a set of named integer constant values. Each distinct enumeration
constitutes a different enumerated type.
> <cite>[N3220](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf), **6.2.5 Types** (p. 40)</cite>

It's important to note that C23 enables specifying the underlying type of the enumeration, which is a [very good idea](https://thephd.dev/c23-is-coming-here-is-what-is-on-the-menu#n3030---enhanced-enumerations).

> An identifier declared as an enumeration constant for an enumeration without a fixed underlying
type has either type int or the enumerated type, as defined in 6․7.3.3. An identifier declared
as an enumeration constant for an enumeration with a fixed underlying type has the associated
enumerated type.
> <cite>[N3220](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf), **6․4․4․4 Enumeration constants** (p. 63)</cite>

The definition of "enumerated type" from section **6․7.3.3 Enumeration specifiers ** (p. 109):

> 2 All enumerations have an underlying type. The underlying type can be explicitly specified using an
enum type specifier and is its fixed underlying type. If it is not explicitly specified, the underlying
type is the enumeration’s compatible type, which is either char or a standard or extended signed or
unsigned integer type.
> <cite>[N3220](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf), **6․7.3.3 Enumeration specifiers** (p. 109)</cite>

So actually, it's probably `int`, or maybe not, because it's _implementation-defined_ (i.e. up to the authors of GCC, Clang, etc.):

> 13 For all enumerations without a fixed underlying type, each enumerated type shall be compatible
with char or a signed or an unsigned integer type that is not bool or a bit-precise integer type. The
choice of type is implementation-defined but shall be capable of representing the values of all
the members of the enumeration.
> <cite>[N3220](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n3220.pdf), **6․7.3.3 Enumeration specifiers** (p. 109)</cite>

The behavior is muddied further with compiler options like `-fshort-enums` that will use the smallest possible integer representation for the enumeration's underlying type.

### Fixed Underlying Type

Fortunately, there is no (good) reason to use `-fshort-enums` since C23 allows specifying a fixed underlying type for each enumerated type definition:

```c
#include <stdint.h>

enum eight_bit : uint8_t {
	HEX00 = 0x00,
	HEX01 = 0x01,
};
```

And, because it's in the C standard, compilers must generate an error if one of the enumeration constants doesn't fit in the fixed underlying type:

```c
#include <stdint.h>

enum eight_bit : uint8_t {
	HEX100 = 0x100
};
```

GCC 14.2.0 (unknown-eabi):
```txt
<source>:4:14: error: enumerator value outside the range of underlying type
	8 |  HEX100 = 0x100,
	  |  ^~~~~
Compiler returned: 1
```


## Type Safety

Because C enums are types, they should afford some degree of type safety. Type safety provides compile time assurances that improve program expressiveness, correctness, size, and performance. However, compilers do not provide type safety for C enums by default.

The following examples were tested with two compilers: `ARM GCC 14.2.0 (unknown-eabi)` and `armv7-a clang 18.1.0`. The compiler and program output is the same between the two compilers unless otherwise noted.

### Exhaustiveness

Generally, when an enum is used in a `switch` statement, the intention is that all constants of the enumerated type are matched by a `case`. If that's not the intention, then it's likely that the enum type should be constrained to a more narrow collection of constants. When the matching handles every possible case, it is said to be _exhaustive_.

Here's an example with a runtime error lurking—because the `switch` is not exhaustive, it is possible to hit the `assert(0)` after the `switch`!

[Interact with this example on Compiler Explorer](https://godbolt.org/z/xd6W7ME6d)
```c
#include <assert.h>
#include <stdint.h>
#include <stdio.h>

enum event : uint8_t {
	EVENT_A = 0,
	EVENT_B,
};

enum result : uint8_t {
	RESULT_A = 0,
	RESULT_B,
};

enum result handle_event(enum event event) {
	switch (event) {
		case EVENT_A:
			return RESULT_A;
	}
	assert(0);
}

int main(void) {
	enum result result = handle_event(0);

	printf("%d\n", result);
}
```
Compiler options: `-Werror`:
```txt
Compiler returned: 0
```
Program output:
```txt
Program returned: 0
Program stdout
0
```

The `handle_event()` function implies that it can handle all members of `enum event`. In reality, the programmer has failed to match the `EVENT_B` case, so passing `EVENT_B`, or 1, as the function argument will cause a runtime error:
```c
int main(void) {
	enum result result = handle_event(1);

	printf("%d\n", result);
}
```
Compiler options: `-Werror`:
```txt
Compiler returned: 0
```
Program output:
```txt
Program returned: 139
Program stderr
output.s: /app/example.c:20: handle_event: Assertion `0' failed.
Program terminated with signal: SIGSEGV
```

Fortunately, simply adding [`-Wall`](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html#index-Wall) covers this common mistake (`-Wextra` is added for completeness).

GCC `-Werror -Wall -Wextra`:
```txt
<source>: In function 'handle_event':
<source>:16:5: error: enumeration value 'EVENT_B' not handled in switch [-Werror=switch]
   16 |  switch (event) {
	  |  ^~~~~~
cc1: all warnings being treated as errors
Compiler returned: 1
```
Clang `-Werror -Wall -Wextra`:
```txt
<source>:16:13: error: enumeration value 'EVENT_B' not handled in switch [-Werror,-Wswitch]
   16 |  switch (event) {
	  | ^~~~~
1 error generated.
Compiler returned: 1
```

Importantly, we can reintroduce this **runtime bug by adding a `default:` case**:
```c
enum result handle_event(enum event event) {
	switch (event) {
		case EVENT_A:
			return RESULT_A;
		default:
			assert(0);
	}
}
```
Compiler options `-Werror -Wall -Wextra`:
```txt
Compiler returned: 0
```
The conclusion is that the use of a `default:` case in the `switch` statement is counterproductive to type safety.

### Type Checking

By adding `-Wall` and avoiding use of a `default:` case, the `switch` statement over the `enum event` is _exhaustive_, therefore it is impossible for a runtime error to occur when the argument given to `handle_event()` is guaranteed to be an `enum event`. However, because  the GCC and Clang compilers do not strictly check the type given to `handle_event()`, the program remains vulnerable to other run time errors.

In this example, `2` is passed to `handle_event()` without generating a compile time error. At run time, it is found that `2` is not handled by the `switch`, causing the assertion to be hit.

[Interact with this example on Compiler Explorer](https://godbolt.org/z/5KMTrjeaM)
```c
#include <assert.h>
#include <stdint.h>
#include <stdio.h>

enum event : uint8_t {
	EVENT_A = 0,
	EVENT_B,
};

enum result : uint8_t {
	RESULT_A = 0,
	RESULT_B,
};

enum result handle_event(enum event event) {
	switch (event) {
		case EVENT_A:
			return RESULT_A;
		case EVENT_B:
			return RESULT_B;
	}
	assert(0);
}

int main(void) {
	enum result result = handle_event(2);

	printf("%d\n", result);
}
```
Compiler options: `-Werror -Wall -Wextra`:
```txt
Compiler returned: 0
```
Program output:
```txt
Program returned: 139
Program stderr
output.s: /app/example.c:22: handle_event: Assertion `0' failed.
Program terminated with signal: SIGSEGV
```

[`-Wextra`](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html#index-W) has added [`-Wenum-conversion`](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html#index-Wenum-conversion), but it doesn't quite do what we want:

> Warn when a value of enumerated type is implicitly converted to a different enumerated type. This warning is enabled by -Wextra in C.
> <cite>[GNU.org](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html#index-Wenum-conversion)</cite>

`-Wenum-conversion` will generate a warning if we provide an incompatible `enum` as argument, even though both the underlying type and value are the same:
```c
	enum result result = handle_event(RESULT_A);
```
GCC `-Werror -Wall -Wextra`:
```txt
<source>:26:39: error: implicit conversion from 'enum result' to 'enum event' [-Werror=enum-conversion]
   26 |  enum result result = handle_event(RESULT_A);
	  |   ^~~~~~~~
```

Instead, what we're looking for is an error caused by passing the underlying type—the integer literal `2`, in the example—instead of the enumerated type as argument. It is provided by [`-Wall`](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html#index-Wall) in the form of [`Wenum-int-mismatch`](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html#index-Wenum-int-mismatch), but there is a catch in the fine print:

> Warn about mismatches between an enumerated type and an integer type in declarations...
> 
> <br>
> 
> ...In C, an enumerated type is compatible with char, a signed integer type, or an unsigned integer type. However, since the choice of the underlying type of an enumerated type is implementation-defined, such mismatches may cause portability issues. In C++, such mismatches are an error. In C, this warning is enabled by -Wall and -Wc++-compat.
> <cite>[GNU.org](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html#index-Wenum-int-mismatch)</cite>

So, in GCC, we need `-Wc++-compat` for the desired compile time type safety.

GCC `-Werror -Wall -Wextra -Wc++-compat`:
```txt
<source>:26:39: error: enum conversion when passing argument 1 of 'handle_event' is invalid in C++ [-Werror=c++-compat]
   26 |  enum result result = handle_event(2);
	  |   ^
<source>:15:13: note: expected 'enum event' but argument is of type 'int'
   15 | enum result handle_event(enum event event) {
	  | ^~~~~~~~~~~~
```

Clang's [`-Wassign-enum`](https://clang.llvm.org/docs/DiagnosticsReference.html#wassign-enum) prevents an error when the integer literal is out of bounds, but it does not cover the general case of enforcing usage of the enum type rather than the underlying type.

Clang `-Werror -Wall -Wextra -Wassign-enum`:
```txt
source>:26:39: error: integer constant not in range of enumerated type 'enum event' [-Werror,-Wassign-enum]
   26 |  enum result result = handle_event(2);
	  |   ^
```
If you know of a Clang compiler option that can enforce this, let me know in the comments! One way to improve things is to use the C++ compiler instead of the C compiler.

Clang C++ `armv7-a clang 18.1.0` (no options needed):
```txt
<source>:26:26: error: no matching function for call to 'handle_event'
   26 |  enum result result = handle_event(1);
	  |  ^~~~~~~~~~~~
<source>:15:13: note: candidate function not viable: no known conversion from 'int' to 'enum event' for 1st argument
   15 | enum result handle_event(enum event event) {
	  | ^		 ~~~~~~~~~~~~~~~~
```
Even though the integer literal is in range of the enum, use of the integer literal still causes a compile time error as desired.


> [!TIP]
> Of course it is possible to cast any random value to the enum type and reintroduce the run time error. Why would a programmer do this? This is a non-issue when the use of casts is avoided altogether—a topic for another article.
> 
> <br>
> 
> If an enum value is not known at compile time (e.g. it's from the user or received on a transport), then the programmer should write a validation function or macro for use when assigning these "unknown values" to the enum type.


## Conclusion

While the C standard may not provide guarantees about enum type safety, the specification lays the groundwork on which compilers have built meaningful assurances of run time correctness.

By avoiding use of a `default` case and adding the `-Werror -Wall -Wextra -Wc++-compat` compiler options, it is **"impossible to generate a run time error"**. Yet, if that is true, then it raises a question about
the necessity of runtime type checking.
> [!CAUTION] If a run time error is not possible, can `assert(0)` be replaced with `__builtin_unreachable()`?

```c
enum result handle_event(enum event event) {
	switch (event) {
		case EVENT_A:
			return RESULT_A;
		case EVENT_B:
			return RESULT_B;
	}
	__builtin_unreachable();
}
```
It certainly [compiles](https://godbolt.org/z/Y39hGx5va) and results in smaller code size. But, without the set of compiler options `-Werror -Wall -Wextra -Wc++-compat`, this is precariously vulnerable to [undefined behavior](https://gcc.gnu.org/onlinedocs/gcc/Other-Builtins.html#index-_005f_005fbuiltin_005funreachable):
> If control flow reaches the point of the __builtin_unreachable, the program is undefined.
> <cite>[GNU.org](https://gcc.gnu.org/onlinedocs/gcc/Other-Builtins.html#index-_005f_005fbuiltin_005funreachable)</cite>

I cannot answer this question confidently, but I can say that I will continue to use defensive runtime assertions and/or error code returns instead of `__builtin_unreachable()`. The benefits of compile time type safety are not solely found in code size and efficiency, but also in the labor that is saved by preventing run time errors.

You can fiddle with the final type safe example at [Compiler Explorer](https://godbolt.org/z/3b89zcasx).

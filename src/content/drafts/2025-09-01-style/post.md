---
title: C Style
author: JP Hutchins
date: 2025-09-01
icon: /crumpledpaper_100x100.png
preview: An argument for code style standards.
---

Arguments about code style are too often dismissed as superfluous, inconvenient, or even harmful. Because the style in which a program presents itself does not impact its execution, guidelines may be seen as unnecessary. Adopting a new style can slow down a programmer's ability to read and write code. And the argument of _style_ itself is considered to be based on the unique opinions and experiences of the authors, wasting precious time that could be spent on developing the product.

So common is the vitriol for this category of unimportant, aesthetic, and overly technical detail, that there is a term for it: _bike-shedding_.

In this paper, I will argue that style is important and saves time during product development. To this end, I will establish measurements of style suitability, and propose that these guidelines have evolved over time within a variety of programming languages. The scope of these recommendations and examples are limited to a subset of the [C-family](https://en.wikipedia.org/wiki/List_of_C-family_programming_languages) of imperative programming languages: C, Rust, and TypeScript; and Python; as well as some functional languages: Elixir, Roc, PureScript, and Nix; and Clojure from the Lisp-family.

The intended audience for this paper are C programmers, as well as all programmers that are interested in programming language syntax.

## The Importance of Style

Most programming languages have at least one style guide.[^1] Some languages have retroactively created official standards, like [Python's PEP8](https://peps.python.org/pep-0008/), while others were designed with a style in mind and feature first class support, such as Rust's definition of a default format and inclusion of `rustfmt` as the [default formatter](https://doc.rust-lang.org/nightly/style-guide/#the-default-rust-style). Other languages have arrived at somewhat common styles through community development and influence over a particular language. For example, C, does not have an official style recommendation, though the ubiquitous nature of the Linux project, which includes a [style guide](https://www.kernel.org/doc/html/v4.10/process/coding-style.html) and a [clang-format](https://www.kernel.org/doc/html/next/dev-tools/clang-format.html) configuration, leads to the adoption of Linux kernel style in projects that are not part of the Linux kernel.[^2]

[^1]: ["Awesome Guidelines"](https://github.com/Kristories/awesome-guidelines). github.com. Retrieved 2025-09-01.
[^2]: ["Zephyr Project - C Code and General Style Guidelines](https://docs.zephyrproject.org/latest/contribute/style/code.html). zephyrproject.org. Retrieved 2025-09-01.


Vast resources are dedicated to the construction and maintenance of tools for formatting the source code of programs. Some widely used examples include [prettier](https://prettier.io/), [clang-format](https://clang.llvm.org/docs/ClangFormat.html), [black](https://github.com/psf/black), and [rustfmt](https://github.com/rust-lang/rustfmt).

Code formatting tools face the complexity of parsing source code
accurately while balancing thoroughness with speed for
complete semantic understanding including all dependencies (similar to
C translation units), while others prioritize speed with simplified
parsing approaches. For example, running [cloc](https://github.com/AlDanial/cloc) on the Python Software Foundation's `black` shows 113,769 lines of Python code across 274 files.[^3]

[^3]: Output of `cloc` run on [black](https://github.com/psf/black) at commit `1f779d`:
	```text
	cloc .
		401 text files.
		371 unique files.
		33 files ignored.

	github.com/AlDanial/cloc v 1.98  T=0.92 s (403.9 files/s, 149171.3 lines/s)
	-------------------------------------------------------------------------------
	Language                     files          blank        comment           code
	-------------------------------------------------------------------------------
	Python                         274           7375           6254         113769
	Markdown                        38           1755             90           4391
	YAML                            18            148             40            833
	diff                             4              5            217            713
	vim script                       2             36             18            274
	Text                             5             43              0            264
	TOML                            13             32             38            236
	JSON                             1              0              0            150
	INI                              4              6              1             95
	DOS Batch                        1              8              1             27
	Dockerfile                       2              6              3             25
	make                             1              4              6             10
	Jupyter Notebook                 6              0            145              8
	SVG                              2              0              0              2
	-------------------------------------------------------------------------------
	SUM:                           371           9418           6813         120797
	-------------------------------------------------------------------------------
	```


 All programming languages have style which evolved organically through the influence of authors, projects, and organizations, while somewhat fewer languages have official styles. Regardless of the provenance of a style, this demonstrates that style is important to programmers, and that they will go to great lengths to encourage its adoption.

 ## The Purpose of Style

 TODO

 ## Requirements for a Good Style

 ### Accessible

 Followup: https://www.reddit.com/r/ProgrammingLanguages/comments/ksk5kw/the_accessibility_of_a_programming_language/

 #### Tabs vs Spaces

 https://www.reddit.com/r/javascript/comments/c8drjo/nobody_talks_about_the_real_reason_to_use_tabs/

 https://www.reddit.com/r/javascript/comments/c8drjo/comment/et2dry5/?utm_source=share&utm_medium=web2x&context=3

 https://www.kernel.org/doc/html/v4.10/process/coding-style.html#indentation

 ### Readable

 ### Writable

 ### Editable

 ### Formattable

 ### Consistent



 ## Functionality

 In this section, I will propose a set of style guidelines that can be universally applied to programming languages.

 ### Collections

 For the purpose of this paper, a _collection_ is any delimited set of items, such as the usual suspects like arrays, structs, and maps, but also including function definitions and calls, control flow statements, and even scope bodies.

There are various ways of formatting collections, but only a few that meet all of our requirements.

#### Collection Does Not Fit on One Line

If a collection does not fit on one line, then each item in the collection should break after the opening delimiter, and before the closing delimiter. Each item in the collection should be on its own line, tab-indented one level from the opening delimiter.

```txt
collection_with_an_extraordinarily_long_name (
	1,
	2,
	3,
	4,
	5,
)
```

| Requirement | Met | Reason                                         |
| ----------- | --- | ---------------------------------------------- |
| Accessible  | ✅   | Supports TAB                                   |
| Readable    | ✅   | Common practice                                |
| Writable    | ✅   | Common practice                                |
| Editable    | ✅   | Precise diff when adding, removing, or editing |
| Formattable | ✅   | Deterministic                                  |
| Consistent  | ✅   | Viable for all collections                     |

#### Collection Fits on One Line

If the collection fits on one line, then it may on one line.
```txt
collection (1, 2, 3, 4, 5)
```

Some languages have extended this style to include collections that _would_ fit on one line after the opening delimiter line break.[^4]

[^4]: [How Black wraps lines](https://black.readthedocs.io/en/stable/the_black_code_style/current_style.html#how-black-wraps-lines). readthedocs.io. Retrieved 2025-09-27.

```txt
collection_with_an_extraordinarily_long_name (
	1, 2, 3, 4, 5
)
```

Both styles can be assessed similarly, with the primary deficiency being the decreased granularity of diffs when editing the name or subset of the collection, and a subtle contradiction with the widely adopted style of placing each statement of a scoped body on its own line.

| Requirement | Met | Reason                                                                                                                                                                                                                                                                                                                                                 |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accessible  | ✅   | Supports TAB                                                                                                                                                                                                                                                                                                                                           |
| Readable    | ✅   | Common practice                                                                                                                                                                                                                                                                                                                                        |
| Writable    | ✅   | Common practice                                                                                                                                                                                                                                                                                                                                        |
| Editable    | ❌   | Diff can include unrelated code                                                                                                                                                                                                                                                                                                                        |
| Formattable | ✅   | Deterministic                                                                                                                                                                                                                                                                                                                                          |
| Consistent  | ❌   | Contradicts scoped body style in most languages. For example, Python cannot do a type or function declaration and definition on a single line: <br>`def add(a: int, b: int) -> int: c = a + b print(c) return c`<br>Other languages, like Rust, can, but it is not idiomatic:<br>`fn add(a: i32, b: i32) -> i32 { let c = a + b; println!("{c}"); c }` |

However, my personal opinion is that the existing adoption of this style in two of the world's most popular programming languages, Python and Rust, is sufficient to justify use of this style, at the discretion of the programmer.

#### Examples

##### Short Function Definition

A collection of arguments that fit on one line, and a collection of statements in the function body.

:::tabbed-code
```c tab="C"
int name(int a, int b) {
	int const out = a + b;
	printf("%d + %d = %d", a, b, out);
	return out;
}
 
 
```

```rust tab="Rust"
fn name(a: i32, b: i32) -> i32 {
	let out = a + b;
	println!("{a} + {b} = {out}");
	out
}
 
 
```

```typescript tab="TS"
const name = (a: number, b: number): number => {
	const out = a + b;
	console.log(`${a} + ${b} = ${out}`);
	return out;
}
 
 
```

```python tab="Py"
def name(a: int, b: int) -> int:
    out: Final = a + b
    print(f"{a} + {b} = {out}")
    return out
 
 
 
```

```elixir tab="Elixir"
def name(a, b) do
    out = a + b
    IO.puts("#{a} + #{b} = #{out}")
    out
end
 
 
```

```rust tab="Roc"
name! : I32, I32 => I32
name! = |a, b|
    out = a + b
    _ = Stdout.line!("$(Num.to_str a) + $(Num.to_str b) = $(Num.to_str out)")
    out
 
 
```

```purescript tab="PS"
name : Int -> Int -> Int
name a b =
	let
		out = a + b
	in
		log (show a ++ " + " ++ show b ++ " = " ++ show out)
		out
```

```nix tab="Nix"
name = a: b: let
	out = a + b;
in
	builtins.trace (
		"${toString a} + ${toString b} = ${toString out}"
	) out
 
```

```clojure tab="Clojure"
(defn name [a b]
	(let [out (+ a b)]
		(println (str a " + " b " = " out))
		out))
 
 
 
```

:::


##### Long Function Names

A collection of arguments that _would_ fit on one line, if grouped after the line break of the opening delimiter, and a collection of statements in the function body.

:::tabbed-code

```c tab="C"
int a_really_really_long_function_name(
	int first, int second
) {
	int const out = first + second;
	...
 
 
```

```rust tab="Rust"
fn a_really_really_long_function_name(
	first: i32, second: i32
) -> i32 {
	let out = first + second;
	...
 
 
```

```typescript tab="TS"
const a_really_really_long_function_name = (
	first: number,
	second: number,
): number => {
	const out = first + second;
	...
 
```

```python tab="Py"
def a_really_really_long_function_name(
	first: int, second: int
) -> int:
	out = first + second
	...
 
 
```

```elixir tab="Elixir"
def a_really_really_long_function_name(
	first, second
) do
    out = first + second
    ...
 
 
```

```rust tab="Roc"
fun a_really_really_long_function_name(
	first: Int, second: Int
): Int {
	let out = first + second
	...
 
 
```

```purescript tab="PS"
a_really_really_long_function_name
	: Int -> Int -> Int
a_really_really_long_function_name
	first second = let
		out = first + second
	in
		...
```

```nix tab="Nix"
a_really_really_long_function_name =
	a: b: let
		out = a + b;
	in
		...
 
 
```

```clojure tab="Clojure"
(defn a-really-really-long-function-name
	[first second]
	(let [out (+ first second)]
		...
 
 
 
```

:::

> [!NOTE] The TypeScript examples throughout are formatted with [prettier](https://prettier.io/) using the default configuration, which will not place multiple parameters on a single line after the opening delimiter line break.

##### Verbose Variable Names

:::tabbed-code
```c tab="C"
int name(
	int first_very_very_long_argument,
	int second_really_really_long_argument,
) {
	int const out_variable_has_a_long_name_as_well = (
		first_very_very_long_argument + second
	);
	printf(
		"%d + %d = %d",
		first_very_very_long_argument,
		second_really_really_long_argument,
		out_variable_has_a_long_name_as_well
	);
	return out_variable_has_a_long_name_as_well;
}
```

:::

##### Terse Function Calls

:::tabbed-code
```c tab="C"
int const result = name(1, 2);
```

```rust tab="Rust"
let result = name(1, 2);
```

```typescript tab="TS"
const result = name(1, 2);
```

```python tab="Py"
result: Final = name(1, 2)
```

```elixir tab="Elixir"
result = name(1, 2)
```

```rust tab="Roc"
result = name(1, 2)
```

```purescript tab="PS"
result = name 1 2
```

```nix tab="Nix"
result = name 1 2;
```

```clojure tab="Clojure"
(def result (name 1 2))
```
:::

##### Long Function Name Calls

:::tabbed-code
```c tab="C"
int const result = a_really_really_long_function_name(
	1, 2, 3, 4, 5
);
```

```rust tab="Rust"
let result = a_really_really_long_function_name(
	1, 2, 3, 4, 5
);
```

:::

##### Array Initialization

Short arrays that fit on one line:

:::tabbed-code
```c tab="C"
int numbers[] = {1, 2, 3, 4, 5};
```

```rust tab="Rust"
let numbers = [1, 2, 3, 4, 5];
```

```typescript tab="TS"
const numbers = [1, 2, 3, 4, 5];
```

```python tab="Py"
numbers: Final = [1, 2, 3, 4, 5]
```

```elixir tab="Elixir"
numbers = [1, 2, 3, 4, 5]
```

```rust tab="Roc"
numbers = [1, 2, 3, 4, 5]
```

```purescript tab="PS"
numbers = [1, 2, 3, 4, 5]
```

```nix tab="Nix"
numbers = [1 2 3 4 5];
```

```clojure tab="Clojure"
(def numbers [1 2 3 4 5])
```
:::

Long arrays that don't fit on one line:

:::tabbed-code
```c tab="C"
int long_array_with_many_elements[] = {
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
};
```

```rust tab="Rust"
let long_array_with_many_elements = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
];
```

```typescript tab="TS"
const long_array_with_many_elements = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
];
```

```python tab="Py"
long_array_with_many_elements: Final = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
]
```

```elixir tab="Elixir"
long_array_with_many_elements = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
]
```

```rust tab="Roc"
long_array_with_many_elements = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
]
```

```purescript tab="PS"
long_array_with_many_elements = [
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
]
```

```nix tab="Nix"
long_array_with_many_elements = [
	1
	2
	3
	4
	5
	6
	7
	8
	9
	10
];
```

```clojure tab="Clojure"
(def long_array_with_many_elements [
	1
	2
	3
	4
	5
	6
	7
	8
	9
	10
])
```
:::

##### Struct Definition and Initialization

Short struct definitions and initialization:

:::tabbed-code
```c tab="C"
struct point {
	int x;
	int y;
};

struct point const p = { .x = 10, .y = 20 };
```

```rust tab="Rust"
struct Point {
	x: i32,
	y: i32,
}

let p = Point {x: 10, y: 20};
```

```typescript tab="TS"
type Point = {
	x: number;
	y: number;
}

const p: Point = { x: 10, y: 20 };
```

```python tab="Py"
class Point(NamedTuple):
	x: int
	y: int


p: Final = Point(x=10, y=20)
```

```elixir tab="Elixir"
defmodule Point do
	defstruct [:x, :y]
end

p = %Point{x: 10, y: 20}
 
```

```rust tab="Roc"
Point : {x : I32, y : I32}

p = {x: 10, y: 20}
 

 
```

```purescript tab="PS"
type Point = {x :: Int, y :: Int}

p = {x: 10, y: 20}


 
```

```nix tab="Nix"
point = {x = 10; y = 20;};




 
```

```clojure tab="Clojure"
(defrecord Point [x y])

(def p (->Point 10 20))


 
```
:::

Long variable names requiring multi-line formatting:

:::tabbed-code
```c tab="C"
struct DatabaseConnectionConfiguration {
	int maximum_connection_timeout_seconds;
	int default_retry_attempts;
	char *server_hostname;
};

struct DatabaseConnectionConfiguration config = {
	.maximum_connection_timeout_seconds = 30,
	.default_retry_attempts = 3,
	.server_hostname = "database.example.com",
};
```

```rust tab="Rust"
struct DatabaseConnectionConfiguration {
	maximum_connection_timeout_seconds: i32,
	default_retry_attempts: i32,
	server_hostname: String,
}

let config = DatabaseConnectionConfiguration {
	maximum_connection_timeout_seconds: 30,
	default_retry_attempts: 3,
	server_hostname: "database.example.com".to_string(),
};
```

```typescript tab="TS"
type DatabaseConnectionConfiguration = {
	maximumConnectionTimeoutSeconds: number;
	defaultRetryAttempts: number;
	serverHostname: string;
}

const config: DatabaseConnectionConfiguration = {
	maximumConnectionTimeoutSeconds: 30,
	defaultRetryAttempts: 3,
	serverHostname: "database.example.com",
};
```

```python tab="Py"
class DatabaseConnectionConfiguration(NamedTuple):
	maximum_connection_timeout_seconds: int
	default_retry_attempts: int
	server_hostname: str

config = DatabaseConnectionConfiguration(
	maximum_connection_timeout_seconds=30,
	default_retry_attempts=3,
	server_hostname="database.example.com",
)
```

```elixir tab="Elixir"
defmodule DatabaseConnectionConfiguration do
	defstruct [
		:maximum_connection_timeout_seconds,
		:default_retry_attempts,
		:server_hostname,
	]
end

config = %DatabaseConnectionConfiguration{
	maximum_connection_timeout_seconds: 30,
	default_retry_attempts: 3,
	server_hostname: "database.example.com",
}
```

```rust tab="Roc"
DatabaseConnectionConfiguration : {
	maximum_connection_timeout_seconds : I32,
	default_retry_attempts : I32,
	server_hostname : Str,
}

config = {
	maximum_connection_timeout_seconds: 30,
	default_retry_attempts: 3,
	server_hostname: "database.example.com",
}
```

```purescript tab="PS"
type DatabaseConnectionConfiguration = {
	maximum_connection_timeout_seconds :: Int,
	default_retry_attempts :: Int,
	server_hostname :: String,
}

config = {
	maximum_connection_timeout_seconds: 30,
	default_retry_attempts: 3,
	server_hostname: "database.example.com",
}
```

```nix tab="Nix"
# Longer attribute sets require multi-line formatting
config = {
	maximumConnectionTimeoutSeconds = 30;
	defaultRetryAttempts = 3;
	serverHostname = "database.example.com";
};
```

```clojure tab="Clojure"
(defrecord DatabaseConnectionConfiguration [
	maximum-connection-timeout-seconds
	default-retry-attempts
	server-hostname
])

(def config (map->DatabaseConnectionConfiguration {
	:maximum-connection-timeout-seconds 30
	:default-retry-attempts 3
	:server-hostname "database.example.com"
}))
```
:::

##### Enumerated Types

Simple enums:

:::tabbed-code
```c tab="C"
enum Color {RED, GREEN, BLUE};
```

```rust tab="Rust"
enum Color {Red, Green, Blue}
```

```typescript tab="TS"
enum Color {Red, Green, Blue}
```

```python tab="Py"
from enum import Enum

class Color(Enum):
	RED = "red"
	GREEN = "green"
	BLUE = "blue"
```

```elixir tab="Elixir"
# Atoms are commonly used for enums
:red
:green
:blue
```

```rust tab="Roc"
Color : [Red, Green, Blue]
```

```purescript tab="PS"
data Color = Red | Green | Blue
```

```nix tab="Nix"
# Typically represented as strings
color = "red"; # or "green" or "blue"
```

```clojure tab="Clojure"
; Keywords are commonly used
:red
:green
:blue
```
:::

## C Particularities & Minutiae

optional braces
macro stuff


---
title: Generic Request -> Response Protocol
author: JP Hutchins
date: 2024-10-13
preview: |
    Python can provide 100% static type coverage for a transport by inferring
    the Type of Response based on the Type of Request.
---

Is 100% static type coverage practical when datatypes represent communication with a remote resource?

If you are implementing a protocol that defines a Response (or Error) Type for every Request, it may seem like lots of code will be written just to satisfy the type system. Fortunately, with a Generic Protocol, you can write a single request function that is type safe for all implementations of Request and Response:
```python
def request(request: Request[TResponse, TError]) -> TResponse | TError
```

## The Problem and the Goal

For example, if we make a `FooRequest`, then our request function should know that it is returning a `FooResponse`.
```python
foo_response = request(FooRequest())
reveal_type(foo_response)  # we expect FooResponse
```
We could satisfy the type system explicity:
```python
def request_foo(foo: FooRequest) -> FooResponse:
    # do side effects on the transport layer
    return FooResponse()
```
The problem is that we would need to write a bunch of `request` functions that satisfy all the possible types. Next would be `def request_bar(bar: BarRequest) -> BarResponse:`, and on and on!

But this is silly, because at compile-time (i.e. static analysis time), the type of literal arguments is known. What we really want is:
```python
def request(request: "Type of request") -> "Type of the response to request":
```
## Handling Request and Response Types
Imagine we have `Request` and `Response` interfaces that are implemented by `Foo` and `Bar`. Each `Request` implementation represents some request to a server, and the `Response` implementation represent the server's deserialized response. Below, I've filled in the implementations with `...` because they would be unique to each specification, transport, etc.
```python
class Request: ...

class Response: ...

class FooRequest(Request): ...
class FooResponse(Response): ...
class Foo(FooRequest):
    Response = FooResponse

class BarRequest(Request): ...
class BarResponse(Response): ...
class Bar(BarRequest):
    Response: BarResponse
```
Now we have `Foo` and `Bar` classes with the class attribute `Response` that points to the Type of Response. Manual usage could look like this:
```python
raw_data = send(Foo())
foo_response = Foo.Response(raw_data)
```
Of course, because the Type of the Response is contained within the Request class, a function could handle this _generically_.
```python
def request(request: Request) -> Response:
    raw_data = send(request)
    # depends on how deserialization is implemented:
    return request.Response.loads(raw_data)
```
This is not bad!  The Python type system understands that the request function takes some implementation of the Request Type, and returns some implementation of the Response Type. And yet, the type system does not know _what_ request was sent, and it especially doesn't know _what_ response was received. We can fix that!

```python
foo_response = request(Foo())
reveal_type(foo_response)  # Response 😔
bar_response = request(Bar())
reveal_type(bar_response)  # Response 😔
```

> [!TIP] You could get more flexibility by adding a Request class variable to the class instead of inheriting from the Request.

## The Request Generic Protocol

There is a simple improvement that we can make to satisfy our goal:
```python
def request(request: "Type of request") -> "Type of the response to request":
```
We will add a Generic Protocol so that the type checker can infer the type of the Response from the type of the Request before runtime.
```python
from typing import Protocol, Type, TypeVar

TResponse = TypeVar("TResponse", bound=Response)

class RequestProtocol(Protocol[TResponse]) -> TResponse:
    Response: Type[TResponse]
```
> [!NOTE] `Protocol[T, ...]` is shorthand for `Protocol, Generic[T, ...]`, [link](https://typing.readthedocs.io/en/latest/spec/protocol.html#generic-protocols).

Now, the we can achieve our goal of communicating that the Type of a Response is dependent on the Type of a Request, information that is known before runtime:
```python
def request(request: RequestProtocol[TResponse]) -> TResponse:
    ...
```
Usage would look like this and the static typing will work as intended:
```python
foo_response = request(Foo())
reveal_type(foo_response)  # FooResponse 🤩
bar_response = request(Bar())
reveal_type(bar_response)  # BarResponse 🤩
```

## Real World Example

A production OSS example is the [smpclient](https://pypi.org/project/smpclient/) library which implements firmware updates and other controls of small embedded systems over serial (USB), BLE, and UDP (network). The [request method](https://github.com/intercreate/smpclient/blob/1c940d9ce7d8dfefd2abda9cb59365868ad04882/smpclient/__init__.py#L106-L188) of the SMP Client maps a generic Request to the corresponding Response, ErrorV1, and ErrorV2 of the Simple Management Protocol specification.

Reality is a lot more complicated than Request -> Response. So how do we deal with a specification that might fail in various ways while maintaining type safety?

## Exhaustive Pattern Matching

I've put together an example that you can run on mypy playground or directly in your own Python interpreter.

It is a slightly more realistic expansion of the Generic Protocol described above. The main difference is that this server can return an Error as well as a Response. In order to prevent runtime errors, we'd like to ensure that for every Request, we've handled every Response. Fortunately, this is doable with Python 3.10+'s [Structural Pattern Matching](https://docs.python.org/3/reference/compound_stmts.html#match):
```python
match status := await request(Status()):
    case StatusResponse():
        reveal_type(status)
    case StatusError():
        reveal_type(status)
    case _:
        assert_never(status)
```
The `case _:` statement, as in Rust, is followed if the pattern is unmatched above. Executing `typing.assert_never(status)` here provides a compile-time check that every return type of the request function has been handled.

> [!NOTE] 
> The `match` statement will not work in Python versions before 3.10. Python 3.9 EOL is in October of 2025, so if you are maintaining a library, it may be most polite to wait until Python 3.9 is retired.

[Check it out on mypy Playground](https://mypy-play.net/?mypy=latest&python=3.12&gist=5636231bd2dd2ae5985f3606a263b64b&flags=strict) or take a look at the corresponding GitHub Gist below:

<script src=https://gist.github.com/mypy-play/5636231bd2dd2ae5985f3606a263b64b.js></script>

## Conclusion

I believe that all Python libraries benefit from 100% static typing coverage. In this post, I showed how Generic Protocols can alleviate some of the repetition encountered as more advanced type system patterns are implemented in Python. Every error that gets caught by the type system prevents a runtime bug, saving time and money.

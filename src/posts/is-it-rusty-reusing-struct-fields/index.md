---
layout: blog.pug
title: Is it Rusty? Reusing struct fields
description: Reusing structs and implementing traits for type-safety.
tags: ["post", "tech", "development", "rust"]
date: "2019-07-10T16:49:00.000+0200"
---

_**Is it Rusty?** These are posts chronicling my journey learning Rust. At this point I'm uncertain whether what I'm doing is actually the recommended way of doing things._

Given two structs with common fields, I was wondering how I could go about creating a "base" struct so that those fields could be shared. For example, if we had the following two structs, how would we share the `name` field?

```rust:title=Rats and dogs
struct MoleRat {
    name: String,
    variant: String,
}

struct Dog {
    name: String,
    breed: String,
}
```

In OOP I'd create a base class which contains that property. However, as far as I can tell, in Rust, there is no notion of inheritance of fields. A solution is to have a third struct which defines the common fields, and an extra field which holds the value of the "child" struct.

```rust:title=Adding a "base" struct
// highlight-start
struct Pet<T> {
    name: String,
    animal: T,
}
// highlight-end

struct MoleRat {
    variant: String,
}

struct Dog {
    breed: String,
}

struct Car {
    make: String,
}
```

These can be used like this:

```rust
fn main() {
    let mole_rat = Pet {
        name: "Oscar".into(),
        animal: MoleRat {
            variant: "Glowing mole-rat".into(),
        },
    };
    println!("My mole-rat: {:?}", mole_rat);
    // My mole-rat: Pet { name: "Oscar", animal: MoleRat { variant: "Glowing mole-rat" } }

    let dog = Pet {
        name: "Odin".into(),
        animal: Dog {
            breed: "Collie-x".into()
        },
    };
    println!("My dog: {:?}", dog);
    // My dog: Pet { name: "Odin", animal: Dog { breed: "Collie-x" } }

    let car = Pet {
        name: "Mini-truck".into(),
        animal: Car {
            make: "Opel".into(),
        }
    };
    println!("My car: {:?}", car);
    // My car: Pet { name: "Mini-truck", animal: Car { make: "Opel" } }
}
```

Cool. But we can add anything we like into `Pet::animal`, including a `Car`. To solve this you can implement a trait to restrict the types that can be set on `animal`.

```rust:title=Using a trait
// highlight-start
trait Animal {}
// highlight-end

#[derive(Debug)]
// highlight-start
struct Pet<T: Animal> {
// highlight-end
    name: String,
    animal: T,
}

#[derive(Debug)]
struct MoleRat {
    variant: String,
}

// highlight-start
impl Animal for MoleRat {}
// highlight-end

#[derive(Debug)]
struct Dog {
    breed: String,
}

// highlight-start
impl Animal for Dog {}
// highlight-end

#[derive(Debug)]
struct Car {
    make: String,
}
```

Now by restricting what can be used in the `animal` field, the previous `fn main {` code will no longer work:

```rust:title=Cannot add a car
fn main() {
    let mole_rat = Pet {
        name: "Oscar".into(),
        animal: MoleRat {
            variant: "Glowing mole-rat".into(),
        },
    };
    println!("My mole-rat: {:?}", mole_rat);

    let dog = Pet {
        name: "Odin".into(),
        animal: Dog {
            breed: "Collie-x".into()
        },
    };
    println!("My dog: {:?}", dog);

    // let car = Pet {
    //     name: "Mini-truck".into(),
    //     animal: Car {
    //         make: "Opel".into(),
    //     }
    // };
    // let car = Pet {
    //           ^^^ the trait `Animal` is not implemented for `Car`
}
```

Try it out in the [playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=05de24290e5b1a23c1edc1bac1fdb193).

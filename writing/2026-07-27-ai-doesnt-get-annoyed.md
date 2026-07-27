---
slug: ai-doesnt-get-annoyed
title: AI Doesn't Get Annoyed
authors: [omry]
tags: [engineering, ai]
description: Compilers exist because humans got tired of writing machine code. What shared concepts will remain implicit when AI can generate the implementation forever?
image: /img/ai-doesnt-get-annoyed-social-card.png
---

import Head from '@docusaurus/Head';

<Head>
  <title>AI Doesn't Get Annoyed</title>
  <meta property="og:title" content="AI Doesn't Get Annoyed" />
  <meta name="twitter:title" content="AI Doesn't Get Annoyed" />
  <meta property="og:image:alt" content="AI Doesn't Get Annoyed by Omry Yadan on Yadan.net." />
  <meta name="twitter:image:alt" content="AI Doesn't Get Annoyed by Omry Yadan on Yadan.net." />
</Head>

*Compilers exist because humans got tired of writing machine code. What shared
concepts will remain implicit when AI can generate the implementation forever?*

## The next compiler

Linus Torvalds made a comparison that I found useful. He objected to describing
AI-assisted code as "written by AI." Compilers already generate all the machine
code, but we do not ordinarily say that the compiler wrote the program. In his
analogy, AI is another tool that changes how the programmer creates software,
not necessarily who created it. [His larger point was that the fundamentals
still matter even as the tools change.](https://lwn.net/Articles/1073761/)

Compilers did not eliminate creativity in programming. They eliminated most of
the need to be creative in machine code. Creativity moved upward, into
algorithms, data structures, languages, interfaces, and systems.

AI may do something similar. The analogy is operational, not mechanical: AI is
not a deterministic translator like a compiler, but it similarly lowers the
cost of turning an intention expressed at one level into an implementation at
another. It can make one person capable of acting across a much larger surface
area.

But there is an important difference.

A compiler generates low-level instructions only after the program has been
expressed in a higher-level formal language. The knowledge has already moved
upward into a durable representation. AI can often generate a lower-level
artifact directly from an informal request, without requiring a stable
language, model, or interface to exist first. It can remove the low-level work
while leaving the knowledge scattered across prompts, generated files, tests,
conventions, and human memory.

<!-- truncate -->

## Annoyance carries information

The best engineers are lazy in a particular way. They will spend a week
eliminating a task that costs them five minutes a day. The immediate economics
may be terrible. But the refusal to tolerate repeated friction is often how
better tools are born.

Sometimes that instinct leads nowhere. But sometimes annoyance is a
wrong-abstraction detector.

It can tell us that we are repeatedly restating durable information. That
several decisions from different layers have been collapsed into one operation.
That the same idea appears in many slightly different forms. That a component
is doing work which logically belongs somewhere else.

In those cases, the irritation is not just about effort. It is evidence that
the system lacks a useful concept.

AI changes this feedback loop. If a command is difficult to construct, an AI
can construct it. If a configuration file is tedious to write, an AI can write
it. If the same integration must be implemented differently in every system,
an AI can keep generating the variations.

The pain disappears, or at least moves out of sight. The complexity does not.

This is not an argument that AI cannot invent abstractions. It plainly can
recognize patterns, propose interfaces, and help design systems. The question
is what it is being asked to optimize. When AI is given a ticket-sized or
case-specific objective, another working implementation is usually a successful
outcome. The fact that humans would hate maintaining fifty such solutions may
never enter the task.

AI can identify maintenance burden, but in most current workflows that
accumulated cost sits outside the task it has been given. It does not spend six
months being interrupted by the fifth variation of the same idea. That
accumulated pressure usually enters through a human who notices the repetition
and decides that it deserves a shared model.

Software history contains many versions of this move. Build systems made
repeated command sequences explicit. Package managers made dependency graphs
explicit. Configuration management made machine state explicit. In each case,
the abstraction did more than save typing: it gave part of the system a durable
model.

The danger is not simply that AI will produce more code. It is that locally
successful implementations can multiply without forcing the shared concept
behind them to become explicit.

## Long command lines are a symptom

One place I have repeatedly felt this problem is in long command lines. A long
command often forces me to reconstruct a model that should already exist
elsewhere.

It may combine the identity of an application with its configuration, storage,
networking, security, environment, execution mode, and deployment details.
These are not all properties of the command. They describe different parts of a
durable system, but the command line flattens them into a sequence of strings to
retain, copy, or regenerate.

The problem is not character count. The problem is that structure has been
turned into an invocation.

Repeated, durable structure belongs in a model. The command line should express
an action, a selection, or a delta.

I had encountered this pattern long before generative AI. It was part of the
motivation behind [Hydra](https://hydra.cc/docs/intro/), a configuration
framework I created for Python applications. Hydra moves durable configuration
into a hierarchical, composable model, while the command line selects
alternatives or states what is different. The model can then be inspected,
validated, saved, and shared instead of being reconstructed for every run.

## Following the annoyance

More recently, while developing a service, I wanted a user to be able to stage
it locally, configure and test it, and then install it permanently.

The apparent container workflow involved a bespoke Dockerfile and a long
command combining details from several layers. I could not be bothered to keep
either the command or its implicit model in my head. I hated it.

I was not a Docker expert, but I had used it enough to understand the ordinary
build-and-run workflow and to know what I disliked about it. An experienced
Docker user might have reached for Docker Compose or another established tool.
But my objection was not simply that I did not know the right command. The
lifecycle I wanted - stage an application, configure it, test it, and then
install it permanently - was being expressed through details from several
different layers.

My first solution was pragmatic. I embedded the staging and installation logic
directly into the service. It worked, but it required a substantial amount of
single-purpose code.

The awkwardness became obvious when I tried to document the installation
process. The user first had to install the Python service into a Python
environment. They would then use that service to create its own Docker
deployment, configure the deployed copy, test it there, and finally install it
as a persistent service. The service was being used to construct and install
another form of itself.

An AI given the ticket-sized task of making the service installable might
reasonably have produced the same workflow, run the tests, and declared success.
But staging and installation were not properties of this particular service.
They were operations on a portable description of an application, its
environment, and its lifecycle. The locally correct solution had the wrong
owner.

I extracted that logic into [Reploy](https://reploy.yadan.net/), which is
unreleased and still evolving. I had previously used Puppet and Chef, so the
value of a durable, declarative infrastructure model was familiar to me.
Existing tools could encode parts of the workflow. Puppet and Chef, for example,
model the desired state of machines and nodes rather than presenting the
portable application lifecycle - stage, change, test, and install - as the
object being manipulated.

As I pulled the logic out, other uses gradually came into view: portable
development environments, repeatable build environments, AI-agent runtimes,
workflow execution, and perhaps remote execution.

This was not a single moment of insight. The local solution came first.
Repeated contact with the problem exposed the missing concept. As I internalized
that concept, more problems began to look like instances of it.

## Cheap code and expensive meaning

There is an obvious counterargument: perhaps AI is correctly making some
abstractions unnecessary.

Repeated implementations are no longer automatically expensive. A shared
abstraction introduces its own costs: coupling, compatibility constraints,
leaky boundaries, and the risk of freezing a generalization before the concept
is understood. Cheap, specialized generated code may sometimes be better than a
framework that costs more than the duplication it replaces.

One-off code is not a failure. Cheap, disposable glue may be exactly the right
answer to a genuinely isolated problem.

AI may therefore reduce the value of abstractions whose main purpose is to
avoid rewriting similar implementations. If the code is easy to regenerate,
compression through reuse is less valuable than it used to be.

But many abstractions do more than save implementation effort. They define what
an object means, who owns a behavior, which invariants must hold, how
compatibility is maintained, where security and failure are reasoned about, and
what users and other systems can rely on.

Generated code may reduce the cost of duplication, but it does not eliminate
the need for shared meaning.

That is why cheap code creates a paradox. It weakens the pressure to abstract,
while abundant code increases the need for trusted abstractions. A locally
correct implementation may be cheap to replace. The expectations accumulated
around a shared model are not.

Code can be regenerated from a prompt. The expectations surrounding it are not
regenerated with it. When AI produces a working solution, the question is
therefore not only whether the code should be reused. It is whether the solution
reveals a concept that needs a name, an owner, and a durable model.

AI systems may eventually be given enough scope and continuity to notice these
patterns for themselves. A system that observes years of maintenance, repeated
implementations, and failures across many projects may conclude that the next
piece of code is evidence of a missing abstraction.

But that is not how most AI-assisted work is framed today. Today, the model is
rewarded for making the next case work.

That is why annoyance still matters. It is the residue left when the
implementation succeeds but the design is wrong. It tells us that the code
works, yet the concept is missing.

If AI can make the wrong level of work feel effortless, what will force us to
invent the level above it?

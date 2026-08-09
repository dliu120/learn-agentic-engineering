# ALLM Academy Curriculum

This context defines the course's teaching vocabulary. The curriculum uses these terms consistently so learners can distinguish levels of control without treating every agent feature as the same thing.

## Fundamentals

**Model Call**:
One request assembled from instructions, current context, and generation settings, followed by one sampled model response. It carries no hidden application state.
_Avoid_: Agent run, conversation

**Context Window**:
The finite token budget visible to the model for one call, including input and generated output.
_Avoid_: Long-term memory, database

**Retrieval / RAG**:
Selecting external information at query time and placing it into the current context. Semantic retrieval uses vector similarity; hybrid retrieval combines semantic and lexical signals; GraphRAG adds entity, relationship, and community structures for graph-shaped questions.
_Avoid_: Memory, training

**Application State**:
Explicit data retained by the surrounding system, such as thread variables, checkpoints, or task status.
_Avoid_: Context window

**Orchestration**:
The control logic that decides which model, tool, function, loop, graph node, or specialist agent runs next.
_Avoid_: Prompting

## Engineering Stages

**Prompt Engineering**:
Designing one model request: instructions, examples, constraints, and the information included for that call.
_Avoid_: Agent engineering, workflow engineering

**Conversation Engineering**:
Designing a multi-turn exchange: roles, turn order, history selection, summaries, and what carries forward between turns.
_Avoid_: Chat prompting, memory engineering

**Response Engineering**:
Designing the contract for one model response: structure, validation, repair, citations, streaming, and safe failure behavior.
_Avoid_: Output prompting, formatting tricks

**Loop Engineering**:
Designing an iterative control loop that calls the model and tools repeatedly with explicit budgets, verification, retries, and termination states.
_Avoid_: Agent loop prompting

**Graph Engineering**:
Designing a workflow as explicit nodes, state, and edges with branches, parallel work, joins, cycles, subgraphs, and human gates.
_Avoid_: Multi-agent prompting, visual orchestration

## Capability Layer

**Tool**:
A typed operation the model can request and the host application executes.
_Avoid_: Skill, plugin

**Skill**:
A reusable capability packaged for an agent, usually combining instructions, tools, examples, or a specialist workflow. It is a course term, not a universal protocol primitive.
_Avoid_: Function call

**Plugin**:
An ecosystem-specific package that installs capabilities into a host application.
_Avoid_: MCP server, extension

**MCP Extension**:
An optional protocol capability negotiated by both MCP peers in addition to the core protocol.
_Avoid_: Plugin

## State and Specifications

**Stateless Request**:
A request that carries everything required to process it and does not depend on hidden state from earlier requests.
_Avoid_: Memoryless application

**Thread State**:
Short-lived state scoped to one conversation or workflow thread.
_Avoid_: Long-term memory

**Durable State**:
State persisted so a workflow can resume after waiting, failure, disconnection, or process restart.
_Avoid_: Chat history

**Checkpoint**:
A persisted snapshot of workflow state used to resume, inspect, or replay a run.
_Avoid_: Long-term memory

**Durable Task**:
A long-running operation represented by an explicit handle that survives disconnection or process restart.
_Avoid_: Hidden session

**Long-Term Memory**:
Cross-thread information intentionally retained for future work, such as user preferences or learned facts.
_Avoid_: Context window, checkpoint

**Agent Specification**:
A testable contract for goals, allowed capabilities, state transitions, invariants, termination, and verification.
_Avoid_: System prompt, implementation plan

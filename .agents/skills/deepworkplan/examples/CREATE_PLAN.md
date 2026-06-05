# How to Create Deep Work Plans

Copy-paste ready prompts for creating new deep work plans.

---

## Simple Prompt (Use 95% of the time)

```
Create a deep work plan following guide/GUIDE.md

Objective: [Your overall goal]

Context:
- Location: [where files are]
- Constraints: [important rules to follow]
- Tech notes: [only if using specific library/approach]

Tasks:
1. [Task 1]
2. [Task 2]
3. [Task 3]

Plan name: PLAN_{descriptive_name}
```

---

## Real Examples

### Example 1: Platform Integration Addition

```
Create a deep work plan following guide/GUIDE.md

Objective: Add WhatsApp platform integration to chatbot functions

Context:
- Location: src/functions/botFlow/handlers/whatsapp/
- Constraints: Follow platform integration factory pattern, use Logger (no console.*), *.spec.ts test naming
- Follow patterns in: docs/ARCHITECTURE.md, existing platforms (Slack, Discord, Teams)

Tasks:
1. Create WhatsApp chat interface
2. Add WhatsApp event parser
3. Create WhatsApp response maker
4. Add integration tests with mocks
5. Update platform factory and documentation

Plan name: PLAN_whatsapp_integration
```

---

### Example 2: Lambda Function Refactoring

```
Create a deep work plan following guide/GUIDE.md

Objective: Refactor botFlow handler system for better maintainability

Context:
- Location: src/functions/botFlow/handlers/
- Constraints: TypeScript strict mode with explicit types, *.spec.ts test naming, Logger only (no console.*)
- Validation: npm run test && npm run eslint:check after each task

Tasks:
1. Extract common handler logic to base class
2. Add explicit TypeScript type annotations to all handlers
3. Write integration tests (comprehensive mock coverage)
4. Update ARCHITECTURE.md with new handler patterns

Plan name: PLAN_refactor_handler_system
```

---

### Example 3: Documentation Reorganization

```
Create a deep work plan following guide/GUIDE.md

Objective: Reorganize and expand project documentation

Context:
- Location: docs/, app/*/README.md
- Constraints: All content in English, update cross-references, follow CLAUDE.md standards

Tasks:
1. Audit existing docs (inventory + identify gaps)
2. Design new structure
3. Migrate content to new organization
4. Fill documentation gaps
5. Update all cross-references and links

Plan name: PLAN_docs_reorganization
```

---

### Example 4: Testing & Coverage

```
Create a deep work plan following guide/GUIDE.md

Objective: Improve test coverage for botFlow event processing

Context:
- Location: test/functions/botFlow/
- Constraints: Use *.spec.ts naming (NOT test_*.ts or *_test.ts), npm run test must pass
- Follow mock patterns in: test/functions/botFlow/mocks/

Tasks:
1. Audit current test coverage (identify gaps)
2. Write unit tests for event parser with all platforms
3. Write integration tests for handler chain execution
4. Add edge case and error handling tests
5. Update TESTING_GUIDE.md with new patterns

Plan name: PLAN_botflow_testing
```

---

### Example 5: New Lambda Function (When Tech Stack IS Relevant)

**Use this pattern when introducing a NEW library or specific approach:**

```
Create a deep work plan following guide/GUIDE.md

Objective: Add AI sentiment analysis using AWS Comprehend

Context:
- Location: src/functions/sentimentAnalysis/ (new Lambda function)
- Tech approach: Use AWS Comprehend SDK for sentiment detection, DynamoDB for result caching
- Integration: Connect with botFlow via SNS events
- Constraints: TypeScript strict mode, Logger only, *.spec.ts test naming, explicit types

Tasks:
1. Create new Lambda function with Serverless Framework config
2. Implement AWS Comprehend integration service
3. Add DynamoDB caching layer for sentiment results
4. Create SNS event handler for botFlow integration
5. Write comprehensive tests with AWS SDK mocks
6. Update serverless config and environment variables
7. Document sentiment analysis flow in docs/ARCHITECTURE.md

Plan name: PLAN_sentiment_analysis_lambda
```

**Why mention tech here?** Because you're introducing AWS Comprehend SDK (new AWS service) and specifying DynamoDB caching (specific approach).

---

## Detailed Prompt (For Complex Cases)

**Use when you need specific control over validations, branches, or commit formats:**

```
Create a deep work plan following guide/GUIDE.md

Objective: [Detailed goal description]

Context:
- Tech stack: [specific versions]
- Files/directories: [exact paths]
- Constraints: [all important rules]
- Related docs: [links]

Tasks:
1. [Task 1 with specific requirements]
2. [Task 2 with specific requirements]
3. [Task 3 with specific requirements]

Plan name: PLAN_{descriptive_name}

Global guidelines:
- Branch: feature/{branch-name}
- Commit format: type(scope): description
- Validations: codecheck, build_static, pytest
- Coverage target: 90%+
- Testing: unit + integration tests required
```

---

## Common Patterns

### Create + Execute Immediately

```
1. Create a deep work plan following guide/GUIDE.md

Objective: [Your goal]
Tasks: [List]
Plan name: PLAN_{name}

2. After creating, execute immediately:
Execute the plan at: .dwp/plans/PLAN_{name}/README.md
```

---

### Create + Review First

```
Create a deep work plan following guide/GUIDE.md

Objective: [Your goal]
Tasks: [List]
Plan name: PLAN_{name}

After creating, show me the plan structure. Wait for approval before executing.
```

---

### Overnight Autonomous Execution

```
Create a deep work plan for overnight autonomous execution following guide/GUIDE.md

Objective: [Your goal]
Tasks: [List with AUTOMATED validations only]
Plan name: PLAN_{name}

CRITICAL: Each task must have automated validation. If ANY fails, STOP and LOG.
```

---

## Tips

### ✅ DO:

- **Be specific about goal**: "Add 5 component pages" not "improve UI"
- **List expected tasks**: Give rough breakdown upfront
- **Name clearly**: `PLAN_ui_expansion` not `PLAN_stuff`
- **Mention validations**: "Run codecheck", "50%+ coverage"
- **Mention tech when relevant**: "Use Stripe SDK" or "Use LangGraph for state machine"
- **Reference existing docs**: "Follow patterns in docs/ui/COMPONENTS_REFERENCE.md"

### ❌ DON'T:

- **Don't repeat project tech stack**: Agents know Node.js, TypeScript, Lambda, Serverless from CLAUDE.md
- **Don't over-specify implementation**: Let agent use judgment
- **Don't skip guide reference**: Always include the guide path
- **Don't forget plan name**: Agent needs to know where to create files
- **Don't be vague**: "Improve error handling" → "Add structured error logging for all Lambda functions"

---

**Next steps:**

- Created plan? Run the **Execute** sub-skill (`../execute/SKILL.md`).
- Need to resume? Run the **Resume** sub-skill (`../resume/SKILL.md`).
- Need status? Run the **Status** sub-skill (`../status/SKILL.md`).

> Note: every prompt above says "following `guide/GUIDE.md`" — but with the
> DeepWorkPlan skill installed you usually just invoke `/dwp-create` (or describe
> your goal) and the **Create** sub-skill drives the whole flow.

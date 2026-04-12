---
title: Render
summary: Deploy Paperclip on Render with Docker, managed Postgres, and a persistent disk
---

Render is a good fit for the hosted Paperclip control plane v1.

This deployment is meant to power the SaaS-style surface area:

- public landing page at `/`
- authenticated sign up / sign in
- guided onboarding at `/onboarding`
- company archetype selection and starter provisioning

This is not yet a fully managed hosted execution plane. Agents still use the existing local-style runtime adapters (`claude_local`, `codex_local`, and similar) inside the Render service.

Recommended layout:

- one Docker web service for the Paperclip app
- one Render PostgreSQL database for `DATABASE_URL`
- one persistent disk mounted at `/paperclip` for agent workspaces, uploads, logs, and local runtime state

Use the Blueprint in `render.yaml` at the repo root.

For the first hosted SaaS deployment in this repo, the default resource names are:

- web service: `paperclip-saas-v1`
- Postgres: `paperclip-saas-v1-db`
- disk: `paperclip-saas-v1-data`

## Why the disk matters

Paperclip can run against hosted Postgres, but it still benefits from persistent local state for:

- agent working directories
- uploaded files when using local storage
- Codex and Claude local session/runtime state
- local logs and backups

## Deploy

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. In Render, create a new Blueprint from the repo.
3. Before the first deploy, set:
   - `PAPERCLIP_PUBLIC_URL` to your final HTTPS URL
   - `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` if you plan to use local adapters
4. Deploy the Blueprint.
5. Open the service URL and use the normal authenticated sign-up flow to create the first customer user.

## Recommended first-pass settings

- Service plan: `starter`
- Database plan: `basic-256mb` for an initial pilot
- Disk size: `10 GB`

For `starter`, also set:

- `NODE_OPTIONS=--max-old-space-size=384`
- `HEARTBEAT_GLOBAL_MAX_CONCURRENT_RUNS=1`
- `PAPERCLIP_MEMORY_SOFT_LIMIT_MB=440`

Those settings reduce the chance that local adapter execution will push the service over Render's 512 MB memory ceiling.

## Important caveat for hosted control-plane v1

Render runs the agents inside the Paperclip container. If you want agents to work on private company repos, give the service Git credentials and clone those repos into a persistent path under `/paperclip`.

If you plan to run many concurrent agents or long-lived coding sessions, consider moving execution off the single web service or upgrading the instance size. The hosted SaaS surface works well on Render, but agent execution capacity is still tied to that single runtime today.

If you see Render events like `Ran out of memory (used over 512MB)`, Paperclip is telling you the truth about the architecture: the control plane and execution plane are sharing one small container. The guardrails above help, but the real production answer is either a larger plan or a separate execution service.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

FX Admin is used by Cignum internal operators and administrators who monitor crypto prices, compare platform FX signals, and manage the internal USD/NGN rate engine.

## Product Purpose

The platform computes and exposes Cignum's internal USD/NGN FX engine rate from market baselines, crypto-implied pricing, liquidity spread, and admin-managed OTC desk configuration.

## Operating Context

Operators use the dashboard to inspect the current rate, review calculation components, compare market sources, run conversions, and update internal crypto or OTC desk inputs. The app is auth-gated and should remain an internal operational tool.

## Capabilities and Constraints

Preserve existing FX, crypto, authentication, Supabase, route, and API behavior. Public partner rate API work remains out of scope until the stale production rate-table issue is resolved.

## Brand Commitments

The current interface name is FX Admin. The binding visual system is Cyan Modernity, using a dark obsidian sidebar, oxygen-cyan app canvas, electric cyan accent, and Inter typography.

## Evidence on Hand

Design source files live in `design/DESIGN.md` and `design/dashboard.md`. The user supplied a dashboard reference image showing the target shell, current-rate panel, sidebar, topbar, and component styling.

## Product Principles

Financial data must be legible at a glance. Administrative actions must remain clear and deliberate. Brand expression should come through high-contrast structure, precise spacing, and restrained cyan accents rather than decorative effects.

## Accessibility & Inclusion

Text contrast is a product requirement: headings and key values use the darkest text color, secondary text remains visibly dark, and focus states are keyboard-visible.

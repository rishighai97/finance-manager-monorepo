# onboarding_samples

Drop a real bank/broker statement file here to onboard it with the `statement-onboard` skill (`.claude/skills/statement-onboard/SKILL.md`).

- **Filename is arbitrary** - no naming convention. Only the file's actual extension matters.
- **Never committed** - this whole directory is gitignored (see `.gitignore`), same reasoning as `scripts/statements/`: real personal financial data.
- The skill asks you which bank/account the sample is for (from the banks already in the database, or "new bank"), and figures out the version itself from existing `account_statement` records - it doesn't parse anything from the filename.
- Once onboarded, delete the file from here if you don't need it locally anymore - it isn't needed after the reader/tests/fixtures have been generated.

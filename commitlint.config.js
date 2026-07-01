/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'jira-key-required': ({ raw }) => {
          const hasJiraKey = /\bSM-\d+\b/.test(raw ?? '')
          return [
            hasJiraKey,
            'Commit must reference a Jira issue key, e.g. "feat(SM-235): ..." or a footer line "Jira: SM-235"',
          ]
        },
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'revert',
        'build',
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
    'jira-key-required': [2, 'always'],
  },
}

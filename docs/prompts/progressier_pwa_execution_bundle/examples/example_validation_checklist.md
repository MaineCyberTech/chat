# Example Validation Checklist

## Functional checks

- [ ] Signed-out landing page still loads
- [ ] Login flow still works
- [ ] Existing workspace navigation still works
- [ ] Existing channel message send/edit/delete still works
- [ ] Socket reconnect still works
- [ ] Notification bell still renders and loads
- [ ] Install CTA appears where expected
- [ ] `/install` route loads
- [ ] Manifest is discoverable
- [ ] Service worker registers without error
- [ ] Push subscribe flow works where browser supports it
- [ ] Message-triggered push path works for at least one validated scenario

## Quality gates

- [ ] lint
- [ ] typecheck
- [ ] unit tests
- [ ] build
- [ ] any added e2e / smoke coverage

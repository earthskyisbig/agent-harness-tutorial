# CLI 설치 및 인증 가이드

이 저장소의 모든 실습은 Claude Code · Codex CLI · Gemini CLI 3개가 필요합니다.

---

## 1. 사전 요구사항

- **Node.js 18+** — `node --version` 으로 확인. 없으면 https://nodejs.org
- **Git** — `git --version`

---

## 2. Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version   # 2.1.x+
```

**인증**:
```bash
claude
# 첫 실행 시 브라우저 열림 → Anthropic 계정으로 OAuth
```

> 공식 문서: https://docs.anthropic.com/claude-code

---

## 3. Codex CLI (OpenAI)

```bash
npm install -g @openai/codex
codex --version   # 0.128.0+
```

**인증**:
```bash
codex login
# 브라우저 열림 → OpenAI 계정으로 OAuth
# 또는 API 키 직접 사용:
#   echo "$OPENAI_API_KEY" | codex login --with-api-key
```

> 공식 문서: https://github.com/openai/codex

---

## 4. Gemini CLI (Google)

```bash
npm install -g @google/gemini-cli
gemini --version   # 0.40.x+
```

**인증**:
```bash
gemini
# 첫 실행 시 브라우저 열림 → Google 계정으로 OAuth
# (별도 인증 명령 없음 — 처음 실행하면 자동 인증 흐름 시작)
```

> 공식 문서: https://github.com/google-gemini/gemini-cli

---

## 5. tmux (Step 4 tmux 3-pane 용)

```bash
# macOS
brew install tmux

# Ubuntu / Debian
sudo apt install tmux
```

```bash
tmux -V   # 3.x+
```

**기본 사용법**:

| 동작 | 명령 |
|---|---|
| 새 세션 시작 | `tmux new-session -s <이름>` |
| 세션 분리 (백그라운드) | `Ctrl-b d` |
| 세션 재접속 | `tmux attach -t <이름>` |
| 세션 목록 | `tmux ls` |

> `Ctrl-b` 는 tmux 기본 prefix — 모든 tmux 단축키 앞에 먼저 누름.

---

## 6. 설치 확인

```bash
claude --version
codex --version
gemini --version
tmux -V   # 3.x+
```

넷 모두 버전 출력되면 실습 준비 완료 → [ep_a_demo/README.md](./ep_a_demo/README.md) 로 이동.

---

## 비용 참고

| CLI | 과금 주체 | 예상 (lab 1회) |
|---|---|---|
| Claude Code | Anthropic (Claude API) | ~$0.05–0.20 |
| Codex | OpenAI (GPT API) | ~$0.05–0.20 |
| Gemini | Google (Gemini API) | ~$0.05–0.10 |

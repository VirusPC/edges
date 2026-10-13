/**
 * Equal-length multiple choice quiz.
 * Usage: Quiz.mount(el, { question, choices: [{id, label}], answer, explainOk, explainBad })
 * Labels should be the same length so formatting doesn't leak the answer.
 */
window.Quiz = {
  mount(root, cfg) {
    const wrap = document.createElement("div");
    wrap.className = "quiz";
    wrap.innerHTML = `<div class="q"></div><div class="choices"></div><div class="feedback" aria-live="polite"></div>`;
    wrap.querySelector(".q").textContent = cfg.question;
    const choicesEl = wrap.querySelector(".choices");
    const feedback = wrap.querySelector(".feedback");

    const shuffled = cfg.choices.slice().sort(() => Math.random() - 0.5);
    shuffled.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = c.label;
      btn.addEventListener("click", () => {
        const all = choicesEl.querySelectorAll("button");
        all.forEach((b) => (b.disabled = true));
        const ok = c.id === cfg.answer;
        btn.classList.add(ok ? "correct" : "wrong");
        if (!ok) {
          const right = shuffled.find((x) => x.id === cfg.answer);
          [...all].forEach((b) => {
            if (b.textContent === right.label) b.classList.add("correct");
          });
        }
        feedback.className = "feedback " + (ok ? "ok" : "bad");
        feedback.textContent = ok ? cfg.explainOk : cfg.explainBad;
      });
      choicesEl.appendChild(btn);
    });

    root.appendChild(wrap);
  },
};

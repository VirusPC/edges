/*
 * teach-crewai quiz component — reusable retrieval-practice quiz.
 *
 * Declare questions in HTML; this script renders them:
 *
 *   <div class="quiz" data-quiz>
 *     <div data-question data-answer="2">           <!-- 1-based index of correct option -->
 *       <p data-stem>Question text</p>
 *       <ol data-options>
 *         <li>Option one</li>
 *         <li>Option two</li>
 *         ...
 *       </ol>
 *       <div data-explanation>Why the answer is right (may contain links).</div>
 *     </div>
 *     ...
 *   </div>
 *
 * Optional: data-shuffle="false" on the quiz container keeps authored option order
 * (default: options are shuffled so position gives no hint).
 * All options are rendered as identical <button>s; styling differs only after answering.
 */
(function () {
  "use strict";

  var LETTERS = "ABCDEFGH";

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function initQuiz(root) {
    var questions = Array.prototype.slice.call(root.querySelectorAll("[data-question]"));
    var doShuffle = root.getAttribute("data-shuffle") !== "false";
    var state = { answered: 0, correct: 0, total: questions.length };

    // Score bar
    var bar = el("div", "quiz-score");
    bar.setAttribute("aria-live", "polite");
    var scoreText = el("span");
    var resetBtn = el("button", null, "重做 / Reset");
    resetBtn.type = "button";
    bar.appendChild(scoreText);
    bar.appendChild(resetBtn);

    function renderScore() {
      var msg = "得分 " + state.correct + " / " + state.total + " · 已答 " + state.answered + " / " + state.total;
      if (state.answered === state.total) {
        msg += state.correct === state.total ? " — 全对！" : " — 答错的题，回到正文对应小节再读一遍。";
      }
      scoreText.textContent = msg;
    }

    var builders = [];

    questions.forEach(function (q, qi) {
      var stemEl = q.querySelector("[data-stem]");
      var listEl = q.querySelector("[data-options]");
      var explEl = q.querySelector("[data-explanation]");
      var answerIdx = parseInt(q.getAttribute("data-answer"), 10) - 1;
      if (!stemEl || !listEl || isNaN(answerIdx)) {
        console.warn("quiz.js: malformed question #" + (qi + 1), q);
        return;
      }
      var optionHTML = Array.prototype.map.call(listEl.children, function (li, i) {
        return { html: li.innerHTML, correct: i === answerIdx };
      });
      var explanationHTML = explEl ? explEl.innerHTML : "";
      var stemHTML = stemEl.innerHTML;

      function build() {
        q.innerHTML = "";
        q.className = "quiz-q";
        var stem = el("p", "quiz-stem");
        var num = el("span", "qnum", "Q" + (qi + 1) + ".");
        stem.appendChild(num);
        var stemBody = el("span");
        stemBody.innerHTML = stemHTML;
        stem.appendChild(stemBody);
        q.appendChild(stem);

        var opts = optionHTML.slice();
        if (doShuffle) shuffle(opts);

        var ul = el("ul", "quiz-options");
        ul.setAttribute("role", "list");
        var feedback = el("div", "quiz-feedback");
        feedback.hidden = true;
        var buttons = [];

        opts.forEach(function (opt, i) {
          var li = el("li");
          var btn = el("button", "quiz-option");
          btn.type = "button";
          btn.innerHTML = LETTERS[i] + ". " + opt.html;
          btn.addEventListener("click", function () {
            if (q.getAttribute("data-done") === "1") return;
            q.setAttribute("data-done", "1");
            state.answered++;
            if (opt.correct) state.correct++;
            buttons.forEach(function (b, bi) {
              b.disabled = true;
              if (opts[bi].correct) {
                b.classList.add("is-correct");
                b.appendChild(el("span", "tag", "✓ 正确答案"));
              }
            });
            if (!opt.correct) {
              btn.classList.add("is-wrong");
              btn.appendChild(el("span", "tag", "✗ 你的选择"));
            }
            feedback.className = "quiz-feedback " + (opt.correct ? "ok" : "bad");
            feedback.innerHTML = "";
            feedback.appendChild(el("span", "verdict", opt.correct ? "答对了。" : "不对。"));
            var body = el("span");
            body.innerHTML = explanationHTML;
            feedback.appendChild(body);
            feedback.hidden = false;
            renderScore();
          });
          buttons.push(btn);
          li.appendChild(btn);
          ul.appendChild(li);
        });

        q.appendChild(ul);
        q.appendChild(feedback);
        q.removeAttribute("data-done");
      }

      builders.push(build);
      build();
    });

    resetBtn.addEventListener("click", function () {
      state.answered = 0;
      state.correct = 0;
      builders.forEach(function (b) { b(); });
      renderScore();
    });

    root.appendChild(bar);
    renderScore();
  }

  function initAll() {
    var roots = document.querySelectorAll("[data-quiz]");
    Array.prototype.forEach.call(roots, initQuiz);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();

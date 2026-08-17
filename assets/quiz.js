(() => {
  const quizzes = document.querySelectorAll(".quiz");

  quizzes.forEach((quiz) => {
    const options = quiz.querySelectorAll(".option");
    const reveal = quiz.querySelector(".reveal");
    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        if (quiz.dataset.answered === "true") return;
        const correct = opt.dataset.correct === "true";
        opt.classList.add(correct ? "correct" : "wrong");
        if (reveal) {
          reveal.textContent = correct ? "✓ Correct." : "✗ Not quite.";
        }
        if (correct) {
          quiz.dataset.answered = "true";
        }
      });
    });
  });
})();

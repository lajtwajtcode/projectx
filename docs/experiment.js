/**
 * Minimal jsPsych task – Iteration 002
 * Local execution, data export via on-screen display + CSV download.
 * + Iteration 004.1: POST results to Formspree on finish (serverless collection)
 */
const htmlButtonResponse = jsPsychHtmlButtonResponse;
const htmlKeyboardResponse = jsPsychHtmlKeyboardResponse;

(function () {
  'use strict';

  // ---- Serverless submit (Formspree) ----
  async function sendResultsToFormspree(jsPsych) {
    const FORMSPREE_URL = "https://formspree.io/f/xnjbqzeb";

    const csv = jsPsych.data.get().csv();

    // Prefer URL subject_id if present (e.g., from Prolific), otherwise fall back to local id.
    const urlSubjectId = new URLSearchParams(window.location.search).get("subject_id") || "";
    const localSubjectId = (jsPsych.data.get().values()[0] || {}).subject_id || "";
    const subject_id = urlSubjectId || localSubjectId;

    const payload = {
      subject_id,
      user_agent: navigator.userAgent,
      data_csv: csv
    };

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const ok = res.ok;
      window.__submit_status = ok ? "ok" : `error_${res.status}`;
      return ok;
    } catch (e) {
      window.__submit_status = `exception_${String(e)}`;
      return false;
    }
  }

  // ---- jsPsych init ----
  var jsPsych = initJsPsych({
    on_finish: async function () {
      // 1) Submit results (best effort)
      const submitted = await sendResultsToFormspree(jsPsych);

      // 2) Show submit status to make debugging easy
      var status = document.createElement('div');
      status.style.marginTop = '1em';
      status.style.padding = '0.75em';
      status.style.border = '1px solid #ccc';
      status.textContent = submitted
        ? '✅ Submitted results to Formspree.'
        : '⚠️ Could not submit results to Formspree. Check console/network.';
      document.body.appendChild(status);

      // 3) Show data on screen (jsPsych built-in)
      jsPsych.data.displayData('csv');

      // 4) Add CSV download link (client-side, no server)
      var csv = jsPsych.data.get().csv();
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'jspsych_data.csv';
      a.textContent = 'Download CSV';
      a.style.marginTop = '1em';
      a.style.display = 'inline-block';
      document.body.appendChild(a);
    }
  });

  // Local subject id (useful for local testing). Prolific can override via URL param (?subject_id=...)
  var subjectId = jsPsych.randomization.randomID(10);
  jsPsych.data.addProperties({ subject_id: subjectId });

  var welcome = {
    type: htmlButtonResponse,
    stimulus: '<p>Minimal task (Iteration 002).</p><p>Tap <b>Start</b> to begin.</p>',
    choices: ['Start']
  };
  
  var trials = [
    { type: htmlButtonResponse, stimulus: '<p>Step 1/3 – Tap <b>Next</b>.</p>', choices: ['Next'] },
    { type: htmlButtonResponse, stimulus: '<p>Step 2/3 – Tap <b>Next</b>.</p>', choices: ['Next'] },
    { type: htmlButtonResponse, stimulus: '<p>Step 3/3 – Tap <b>Finish</b> to submit.</p><p style="font-size:12px;opacity:0.7;">Wait 2–3 seconds after finishing.</p>', choices: ['Finish'] }
  ];
  
  var goodbye = {
    type: htmlButtonResponse,
    stimulus: '<p>Done. Submitting…</p>',
    choices: ['Show data']
  };
  
  var timeline = [welcome].concat(trials).concat([goodbye]);
  jsPsych.run(timeline);
  
})();


(function () {
  'use strict';

  var D = window.DATA;

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var on = function (el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); };

  function debounce(fn, ms) {
    var t; return function () {
      var a = arguments, c = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms);
    };
  }

  function net(fast) {
    var base = OPTS.slow ? 2800 : (fast ? 550 : 1100);
    return new Promise(function (res) { setTimeout(res, base + Math.random() * 250); });
  }

  var OPTS = { slow: false, failOtp: false, failSubmit: false };

  var KEY = 'extroverts.draft.v1';

  var S = {
    mode: 'signup',
    step: 1,
    emailVerified: false,
    email: '',
    fullName: '',
    dob: { d: '', m: '', y: '' },
    age: null,
    pronouns: '',
    pronounCustom: '',
    state: '',
    city: '',
    college: '',
    collegeOther: '',
    phone: '',
    username: '',
    interests: [],
    bio: ''
  };

  var noSave = true, restoring = false;

  var saveDraft = debounce(function () {
    if (noSave) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {  }
  }, 250);

  function loadDraft() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return (d && typeof d === 'object') ? d : null;
    } catch (e) { return null; }
  }

  function clearDraft() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  var ICONS = { err: '!', ok: '✓', info: 'i' };

  function toast(kind, title, body, ms) {
    var wrap = $('#toasts');

    var live = $$('.toast', wrap).filter(function (t) { return !t.classList.contains('is-out'); });
    live.forEach(function (t) {
      if ($('strong', t).textContent === title) t.parentNode.removeChild(t);
    });
    live = $$('.toast', wrap);
    while (live.length >= 2) { live[0].parentNode.removeChild(live[0]); live.shift(); }

    var el = document.createElement('div');
    el.className = 'toast toast--' + kind;
    el.innerHTML = '<span class="toast__ico">' + ICONS[kind] + '</span><div><strong></strong>' +
                   (body ? '<p></p>' : '') + '</div>';
    $('strong', el).textContent = title;
    if (body) $('p', el).textContent = body;
    wrap.appendChild(el);

    var kill = function () {
      el.classList.add('is-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
    };
    setTimeout(kill, ms || 4200);
    on(el, 'click', kill);
  }

  function show(name) {

    $('#toasts').innerHTML = '';
    $$('.screen').forEach(function (s) { s.classList.toggle('is-active', s.dataset.screen === name); });
    window.scrollTo(0, 0);
    if (name === 'landing') story.start(); else story.stop();
  }

  var story = (function () {
    var DUR = 6000, i = 0, timer = null, running = false;
    var slides = $$('.slide'), bars = $$('#storyBars .bar');

    function paint() {
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
      bars.forEach(function (b, n) {
        b.classList.remove('is-live', 'is-done');
        if (n < i) b.classList.add('is-done');
      });

      var live = bars[i];
      live.classList.remove('is-live');
      void live.offsetWidth;
      live.classList.add('is-live');
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(function () { go(i + 1); }, DUR);
    }

    function go(n) {
      i = (n + slides.length) % slides.length;
      paint();
      if (running) schedule();
    }

    return {
      start: function () { running = true; go(i); },
      stop:  function () { running = false; clearTimeout(timer); },
      next:  function () { go(i + 1); },
      prev:  function () { go(i - 1); },
      pause: function () { clearTimeout(timer); $('.landing').classList.add('is-paused'); },
      resume: function () { $('.landing').classList.remove('is-paused'); if (running) schedule(); }
    };
  })();

  on($('#storyNext'), 'click', function () { story.next(); });
  on($('#storyPrev'), 'click', function () { story.prev(); });

  (function () {
    var stage = $('#storyStage'), x0 = null;
    ['mousedown', 'touchstart'].forEach(function (e) {
      on(stage, e, function (ev) {
        story.pause();
        x0 = ev.touches ? ev.touches[0].clientX : ev.clientX;
      }, { passive: true });
    });
    ['mouseup', 'touchend', 'mouseleave'].forEach(function (e) {
      on(stage, e, function (ev) {
        story.resume();
        if (x0 === null) return;
        var x1 = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX;
        if (typeof x1 === 'number' && Math.abs(x1 - x0) > 60) {
          (x1 < x0) ? story.next() : story.prev();
        }
        x0 = null;
      });
    });
  })();

  on(document, 'keydown', function (e) {
    if (!$('#screen-landing').classList.contains('is-active')) return;
    if (e.key === 'ArrowRight') story.next();
    if (e.key === 'ArrowLeft') story.prev();
  });

  var termsFor = 'signup';

  function openTerms(from) {
    termsFor = from || 'signup';
    show('terms');
    var body = $('#termsBody');
    body.scrollTop = 0;
    resetTerms();
    setTimeout(function () { body.focus(); checkTermsEnd(); }, 60);
  }

  function checkTermsEnd() {
    var el = $('#termsBody');
    if (!el || !$('#termsAgree').disabled) return;
    var noScroll = el.scrollHeight <= el.clientHeight + 4;
    var atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (!noScroll && !atEnd) return;

    $('#termsAgree').disabled = false;
    $('#termsCheckWrap').classList.remove('is-locked');
    var hint = $('#termsHint');
    hint.classList.add('is-done');
    hint.innerHTML = '<span class="dot-pulse" style="background:currentColor"></span> You have reached the end — you can continue';
  }

  function resetTerms() {
    $('#termsAgree').checked = false;
    $('#termsAgree').disabled = true;
    $('#termsAccept').disabled = true;
    $('#termsCheckWrap').classList.add('is-locked');
    var hint = $('#termsHint');
    hint.classList.remove('is-done');
    hint.innerHTML = '<span class="dot-pulse"></span> Scroll to the end to continue';
  }

  on($('#termsBody'), 'scroll', checkTermsEnd);
  on(window, 'resize', debounce(checkTermsEnd, 150));

  on($('#termsAgree'), 'change', function () {
    $('#termsAccept').disabled = !this.checked;
  });

  on($('#termsAccept'), 'click', function () {
    if (!$('#termsAgree').checked) return;
    show('wizard');
    goStep(1, 'fwd');
  });

  on($('#termsDecline'), 'click', function () {
    show('landing');
    toast('info', 'No problem', 'You can read the terms again any time from the landing page.');
  });

  on($('#termsBack'), 'click', function () { show('landing'); });
  on($('#openTerms'), 'click', function () { openTerms('read'); });

  function field(name) { return $('.field[data-field="' + name + '"]'); }

  function setErr(name, msg) {
    var f = field(name); if (!f) return;
    var p = $('.err', f);
    f.classList.add('is-invalid');
    f.classList.remove('is-valid', 'is-checking');
    if (p) { p.textContent = msg; p.classList.add('is-on'); }
  }

  function setOk(name, silent) {
    var f = field(name); if (!f) return;
    var p = $('.err', f);
    f.classList.remove('is-invalid', 'is-checking');
    if (!silent) f.classList.add('is-valid');
    if (p) { p.classList.remove('is-on'); p.textContent = ''; }
  }

  function setNeutral(name) {
    var f = field(name); if (!f) return;
    var p = $('.err', f);
    f.classList.remove('is-invalid', 'is-valid', 'is-checking');
    if (p) { p.classList.remove('is-on'); p.textContent = ''; }
  }

  function shake(name) {
    var f = field(name); if (!f) return;
    var target = $('.control', f) || $('.dob', f) || $('.otp', f) || f;
    target.classList.remove('shake');
    void target.offsetWidth;
    target.classList.add('shake');
  }

  function failSubmit(list) {
    var first = list[0];
    shake(first);
    var f = field(first);
    var input = $('input,select,textarea', f);
    if (input && !input.disabled) input.focus();
    toast('err', list.length > 1 ? list.length + ' fields need your attention' : 'One field needs your attention',
                 'Check the highlighted field' + (list.length > 1 ? 's' : '') + ' and try again.');
  }

  var V = {};

  V.email = function (raw) {
    var v = (raw || '').trim();
    if (!v) return 'Email address is required.';
    if (/\s/.test(v)) return 'Email addresses cannot contain spaces.';
    if (v.length > 254) return 'That email is too long.';
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return 'Enter a valid email, like you@college.edu';
    if (/\.{2,}/.test(v)) return 'Enter a valid email, like you@college.edu';
    return '';
  };

  V.fullName = function (raw) {
    var v = (raw || '').trim().replace(/\s+/g, ' ');
    if (!v) return 'Please tell us your name.';
    if (v.length < 2) return 'Your name needs at least 2 characters.';
    if (/\d/.test(v)) return 'Names cannot contain numbers.';
    if (!/^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ' .-]*$/.test(v)) return 'Use letters, spaces, hyphens or apostrophes only.';
    return '';
  };

  function ageFrom(d, m, y) {
    var today = new Date();
    var a = today.getFullYear() - y;
    var mDiff = (today.getMonth() + 1) - m;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) a--;
    return a;
  }

  V.dob = function (dd, mm, yy) {
    if (!dd && !mm && !yy) return 'Enter your date of birth.';
    if (!dd || !mm || !yy) return 'Enter the full date — day, month and year.';
    var d = +dd, m = +mm, y = +yy;
    if (yy.length !== 4) return 'Enter the year in full, like 2004.';
    if (m < 1 || m > 12) return 'Month must be between 01 and 12.';
    var maxDay = new Date(y, m, 0).getDate();
    if (d < 1 || d > maxDay) return 'That day does not exist in the month you picked.';
    var dt = new Date(y, m - 1, d);
    if (dt > new Date()) return 'Your date of birth cannot be in the future.';
    var age = ageFrom(d, m, y);
    if (age > 100) return 'Please double-check the year you entered.';
    if (age < 18) return 'You have to be 18 or older to join Extroverts. Come back on your 18th birthday — we will be here.';
    return '';
  };

  V.phone = function (raw) {
    var v = (raw || '').replace(/\D/g, '');
    if (!v) return 'Mobile number is required.';
    if (v.length < 10) return 'Enter all 10 digits (' + v.length + '/10 so far).';
    if (!/^[6-9]/.test(v)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
    if (/^(\d)\1{9}$/.test(v)) return 'That does not look like a real number.';
    return '';
  };

  V.username = function (raw) {
    var v = (raw || '').trim();
    if (!v) return 'Pick a handle so people can find you.';
    if (v.length < 3) return 'Handles need at least 3 characters.';
    if (v.length > 20) return 'Handles can be at most 20 characters.';
    if (!/^[a-z0-9_]+$/.test(v)) return 'Only lowercase letters, numbers and underscores.';
    if (/^\d+$/.test(v)) return 'Handles cannot be only numbers.';
    return '';
  };

  V.bio = function (raw) {
    var v = raw || '';
    if (v.length && !v.trim()) return 'Your bio cannot be only spaces.';
    if (v.length > 150) return 'Keep it to 150 characters.';
    return '';
  };

  function wireCounter(id, max) {
    var input = $('#' + id);
    var out = $('[data-counter-for="' + id + '"]');
    if (!input || !out) return;
    var paint = function () {
      var n = input.value.length;
      out.textContent = n + '/' + max;
      out.classList.toggle('is-warn', n >= max * 0.85 && n < max);
      out.classList.toggle('is-max', n >= max);
    };
    on(input, 'input', paint);
    paint();
  }

  var PANE_COPY = {
    1: ['Strangers.<br><span class="grad">Hangouts.</span><br>Memories.', 'Four quick steps and the city opens up.'],
    2: ['Who are<br><span class="grad">you, really?</span>', 'Your name and your pronouns, so hosts greet you right.'],
    3: ['Parties<br><span class="grad">near you.</span>', 'Pick your city and we will only show hangouts you can reach.'],
    4: ['Let vibes<br><span class="grad">find vibes.</span>', 'The themes you pick decide which parties find you.']
  };

  function goStep(n, dir) {
    S.step = n;
    var steps = $$('.step');
    steps.forEach(function (s) {
      var active = +s.dataset.step === n;
      s.classList.remove('is-back');
      s.classList.toggle('is-active', active);
      if (active && dir === 'back') {
        s.classList.add('is-back');
        setTimeout(function () { s.classList.remove('is-back'); }, 340);
      }
    });

    $$('.steps__seg').forEach(function (seg) {
      var i = +seg.dataset.seg;
      seg.classList.toggle('is-done', i < n);
      seg.classList.toggle('is-current', i === n);
    });

    $('#stepCount').textContent = 'Step ' + n + ' of 4';
    $('#wizBack').disabled = (n === 1 && authPane === 'email');

    $$('#paneSteps li').forEach(function (li) {
      var i = +li.dataset.paneStep;
      li.classList.toggle('is-current', i === n);
      li.classList.toggle('is-done', i < n);
    });
    $('#paneHeadline').innerHTML = PANE_COPY[n][0];
    $('#paneSub').textContent = PANE_COPY[n][1];

    var first = $('.step[data-step="' + n + '"] .pane.is-active input, .step[data-step="' + n + '"] input, .step[data-step="' + n + '"] select');
    if (first && !first.disabled) setTimeout(function () { first.focus({ preventScroll: true }); }, 160);

    $('.formpane__scroll').scrollTop = 0;
    window.scrollTo(0, 0);
    saveDraft();
  }

  on($('#wizBack'), 'click', function () {
    if (S.step === 1 && authPane === 'otp') { setPane('email'); return; }
    if (S.step === 1) { show('landing'); return; }
    goStep(S.step - 1, 'back');
  });

  on($('#wizClose'), 'click', function () {
    openModal('Leave signup?',
      'Your progress is saved on this device, so you can pick up right where you left off.',
      'Leave', function () { show('landing'); syncLandingCta(); });
  });

  var authPane = 'email';
  var otpAttempts = 0, resendTimer = null;

  function setPane(name, dir) {
    authPane = name;
    $$('.step[data-step="1"] .pane').forEach(function (p) {
      var active = p.dataset.pane === name;
      p.classList.remove('is-back');
      p.classList.toggle('is-active', active);
      if (active && dir === 'back') {
        p.classList.add('is-back');
        setTimeout(function () { p.classList.remove('is-back'); }, 340);
      }
    });
    $('#wizBack').disabled = false;
    if (name === 'otp') {
      otpInputs[0].focus();
    } else {
      setTimeout(function () { $('#email').focus(); }, 120);
    }
  }

  function setMode(mode) {
    S.mode = mode;
    var login = mode === 'login';
    $('#authTitle').textContent = login ? 'Welcome back' : "What's your email?";
    $('#authSub').textContent = login
      ? 'Enter the email you signed up with and we will send you a code.'
      : "We'll send a 6-digit code to make sure it's really you.";
    $('#btnSendOtp .btn__label').textContent = login ? 'Send login code' : 'Send code';
    $('[data-mode="signup"]').hidden = login;
    $('[data-mode="login"]').hidden = !login;
  }

  on($('#toLogin'), 'click', function () { setMode('login'); setNeutral('email'); });
  on($('#toSignup'), 'click', function () { setMode('signup'); setNeutral('email'); });

  (function () {
    var input = $('#email'), touched = false;

    on(input, 'blur', function () {
      touched = true;
      var msg = V.email(input.value);
      if (input.value.trim() === '') { setNeutral('email'); return; }
      msg ? setErr('email', msg) : setOk('email');
      S.email = input.value.trim().toLowerCase();
      saveDraft();
    });

    on(input, 'input', function () {

      if (/\s/.test(input.value)) input.value = input.value.replace(/\s/g, '');
      if (!touched) return;
      var msg = V.email(input.value);
      msg ? setErr('email', msg) : setOk('email');
    });
  })();

  on($('#formEmail'), 'submit', function (e) {
    e.preventDefault();
    var input = $('#email');
    var msg = V.email(input.value);
    if (msg) { setErr('email', msg); shake('email'); input.focus(); return; }

    var email = input.value.trim().toLowerCase();
    setOk('email');

    var btn = $('#btnSendOtp');
    btn.classList.add('is-loading');
    btn.disabled = true;

    net().then(function () {
      btn.classList.remove('is-loading');
      btn.disabled = false;

      if (OPTS.failOtp) {
        toast('err', 'We could not send the code', 'Something went wrong on our side. Please try again.');
        setErr('email', 'We could not reach our mail service. Try again in a moment.');
        return;
      }

      var known = D.REGISTERED.indexOf(email) > -1;

      if (S.mode === 'signup' && known) {
        setErr('email', 'An account already exists with this email.');
        toast('err', 'Account already exists', 'Log in instead — we have switched you over.');
        setMode('login');
        return;
      }
      if (S.mode === 'login' && !known) {
        setErr('email', 'We could not find an account with that email.');
        toast('err', 'No account found', 'Create one instead — it takes about a minute.');
        return;
      }

      S.email = email;
      saveDraft();
      $('#otpTarget').textContent = email;
      clearOtp();
      otpAttempts = 0;
      setPane('otp');
      startResend();
      toast('ok', 'Code sent', 'We sent a 6-digit code to ' + email + '.');
    });
  });

  on($('#changeEmail'), 'click', function () { setPane('email', 'back'); });

  on($('#btnGoogle'), 'click', function () {
    var btn = this;
    btn.classList.add('is-loading');
    btn.disabled = true;

    net().then(function () {
      btn.classList.remove('is-loading');
      btn.disabled = false;

      S.email = 'vaibhav.singh@gmail.com';
      S.emailVerified = true;
      saveDraft();

      toast('ok', 'Signed in with Google', S.email);
      if (S.mode === 'login') { setTimeout(finishLogin, 450); return; }
      setTimeout(function () { goStep(2, 'fwd'); }, 450);
    });
  });

  var otpInputs = $$('#otpBoxes .otp__box');

  function otpValue() { return otpInputs.map(function (i) { return i.value; }).join(''); }

  function clearOtp() {
    otpInputs.forEach(function (i) { i.value = ''; i.classList.remove('is-filled'); });
    $('#otpBoxes').classList.remove('is-locked');
    setNeutral('otp');
    $('#btnVerify').disabled = true;
  }

  function syncOtpButton() {
    var v = otpValue();
    $('#btnVerify').disabled = v.length !== 6;
    otpInputs.forEach(function (i) { i.classList.toggle('is-filled', !!i.value); });
  }

  otpInputs.forEach(function (box, idx) {
    on(box, 'input', function () {
      box.value = box.value.replace(/\D/g, '').slice(0, 1);
      setNeutral('otp');
      if (box.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
      syncOtpButton();
      if (otpValue().length === 6) $('#formOtp').requestSubmit();
    });

    on(box, 'keydown', function (e) {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        otpInputs[idx - 1].focus();
        otpInputs[idx - 1].value = '';
        syncOtpButton();
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' && idx > 0) otpInputs[idx - 1].focus();
      if (e.key === 'ArrowRight' && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
    });

    on(box, 'paste', function (e) {
      e.preventDefault();
      var txt = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      if (!txt) return;
      txt.split('').forEach(function (ch, n) { if (otpInputs[n]) otpInputs[n].value = ch; });
      syncOtpButton();
      otpInputs[Math.min(txt.length, 5)].focus();
      if (txt.length === 6) $('#formOtp').requestSubmit();
    });

    on(box, 'focus', function () { box.select(); });
  });

  function startResend() {
    var left = 30;
    $('#btnResend').hidden = true;
    $('#resendWait').hidden = false;
    $('#resendTimer').textContent = left;
    clearInterval(resendTimer);
    resendTimer = setInterval(function () {
      left--;
      $('#resendTimer').textContent = left;
      if (left <= 0) {
        clearInterval(resendTimer);
        $('#resendWait').hidden = true;
        $('#btnResend').hidden = false;
      }
    }, 1000);
  }

  on($('#btnResend'), 'click', function () {
    clearOtp();
    otpAttempts = 0;
    startResend();
    toast('ok', 'New code sent', 'The previous code is no longer valid.');
    otpInputs[0].focus();
  });

  on($('#formOtp'), 'submit', function (e) {
    e.preventDefault();
    var code = otpValue();
    if (code.length !== 6) { setErr('otp', 'Enter all 6 digits.'); shake('otp'); return; }

    var btn = $('#btnVerify');
    btn.classList.add('is-loading');
    btn.disabled = true;
    $('#otpBoxes').classList.add('is-locked');

    net(true).then(function () {
      btn.classList.remove('is-loading');
      $('#otpBoxes').classList.remove('is-locked');

      if (code === D.OTP) {
        setOk('otp', true);
        S.emailVerified = true;
        saveDraft();
        toast('ok', 'Email verified', S.mode === 'login' ? 'Signing you in…' : 'Nice. Two minutes and you are done.');

        if (S.mode === 'login') {
          setTimeout(function () { finishLogin(); }, 500);
          return;
        }
        setTimeout(function () { goStep(2, 'fwd'); }, 380);
        return;
      }

      otpAttempts++;
      var left = 3 - otpAttempts;
      btn.disabled = false;

      if (left <= 0) {
        $('#otpBoxes').classList.add('is-locked');
        setErr('otp', 'Too many incorrect attempts. Request a new code to continue.');
        toast('err', 'Code locked', 'For your security we locked this code. Tap resend for a fresh one.', 5200);
        clearInterval(resendTimer);
        $('#resendWait').hidden = true;
        $('#btnResend').hidden = false;
        btn.disabled = true;
      } else {
        setErr('otp', 'That code is not right. ' + left + ' attempt' + (left === 1 ? '' : 's') + ' left.');
        shake('otp');
        otpInputs.forEach(function (i) { i.value = ''; i.classList.remove('is-filled'); });
        otpInputs[0].focus();
        $('#btnVerify').disabled = true;
      }
    });
  });

  wireCounter('fullName', 40);

  (function () {
    var input = $('#fullName'), touched = false;
    on(input, 'blur', function () {
      touched = true;
      if (!input.value) { setNeutral('fullName'); return; }
      input.value = input.value.trim().replace(/\s+/g, ' ');
      var msg = V.fullName(input.value);
      msg ? setErr('fullName', msg) : setOk('fullName');
      S.fullName = input.value;
      saveDraft();
    });
    on(input, 'input', function () {
      if (input.value.charAt(0) === ' ') input.value = input.value.replace(/^\s+/, '');
      if (!touched) return;
      var msg = V.fullName(input.value);
      msg ? setErr('fullName', msg) : setOk('fullName');
    });
  })();

  (function () {
    var d = $('#dobD'), m = $('#dobM'), y = $('#dobY');
    var parts = [d, m, y];

    function paintAge() {
      var chip = $('#ageChip');
      if (d.value.length && m.value.length && y.value.length === 4) {
        var msg = V.dob(d.value, m.value, y.value);
        var age = ageFrom(+d.value, +m.value, +y.value);
        if (!msg) {
          chip.hidden = false;
          chip.classList.remove('is-bad');
          chip.textContent = age + ' years old';
          setOk('dob');
        } else if (age < 18 && age >= 0) {
          chip.hidden = false;
          chip.classList.add('is-bad');
          chip.textContent = age + ' — under 18';
          setErr('dob', msg);
        } else {
          chip.hidden = true;
          setErr('dob', msg);
        }
        S.dob = { d: d.value, m: m.value, y: y.value };
        S.age = msg ? null : age;
        saveDraft();
      } else {
        chip.hidden = true;
        setNeutral('dob');
      }
    }

    parts.forEach(function (el, i) {
      on(el, 'input', function () {
        el.value = el.value.replace(/\D/g, '');
        var max = el === y ? 4 : 2;
        if (el.value.length >= max && i < parts.length - 1) parts[i + 1].focus();
        paintAge();
      });
      on(el, 'keydown', function (e) {
        if (e.key === 'Backspace' && !el.value && i > 0) { parts[i - 1].focus(); e.preventDefault(); }
      });
      on(el, 'blur', function () {

        if (el !== y && el.value.length === 1) el.value = '0' + el.value;
        paintAge();
      });
    });
  })();

  (function () {
    var wrap = $('#pronounChips');
    on(wrap, 'click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', wrap).forEach(function (c) {
        c.classList.toggle('is-on', c === chip);
        c.setAttribute('aria-checked', c === chip ? 'true' : 'false');
      });
      S.pronouns = chip.dataset.val;
      var custom = chip.dataset.val === 'custom';
      $('#pronounCustomWrap').hidden = !custom;
      if (custom) setTimeout(function () { $('#pronounCustom').focus(); }, 60);
      setNeutral('pronouns');
      saveDraft();
    });
    on($('#pronounCustom'), 'input', function () {
      S.pronounCustom = this.value;
      setNeutral('pronouns');
      saveDraft();
    });
  })();

  on($('#formIdentity'), 'submit', function (e) {
    e.preventDefault();
    var bad = [];

    var nameMsg = V.fullName($('#fullName').value);
    if (nameMsg) { setErr('fullName', nameMsg); bad.push('fullName'); } else setOk('fullName');

    var dobMsg = V.dob($('#dobD').value, $('#dobM').value, $('#dobY').value);
    if (dobMsg) { setErr('dob', dobMsg); bad.push('dob'); } else setOk('dob');

    if (!S.pronouns) { setErr('pronouns', 'Pick the pronouns you go by.'); bad.push('pronouns'); }
    else if (S.pronouns === 'custom') {
      var c = $('#pronounCustom').value.trim();
      if (!c) { setErr('pronouns', 'Type the pronouns you use.'); bad.push('pronouns'); }
      else if (c.length < 2) { setErr('pronouns', 'That looks too short.'); bad.push('pronouns'); }
      else setOk('pronouns', true);
    } else setOk('pronouns', true);

    if (bad.length) { failSubmit(bad); return; }

    S.fullName = $('#fullName').value.trim();
    S.pronounCustom = $('#pronounCustom').value.trim();
    saveDraft();

    var btn = $('button[type="submit"]', this);
    btn.classList.add('is-loading');
    btn.disabled = true;
    net(true).then(function () {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      goStep(3, 'fwd');
    });
  });

  (function () {
    var st = $('#state'), ct = $('#city'), cl = $('#college');

    D.states().forEach(function (s) {
      var o = document.createElement('option');
      o.value = s; o.textContent = s;
      st.appendChild(o);
    });

    function fill(sel, items, placeholder, extra) {
      sel.innerHTML = '';
      var p = document.createElement('option');
      p.value = ''; p.textContent = placeholder;
      sel.appendChild(p);
      items.forEach(function (i) {
        var o = document.createElement('option');
        o.value = i; o.textContent = i;
        sel.appendChild(o);
      });
      if (extra) {
        var o2 = document.createElement('option');
        o2.value = '__other'; o2.textContent = extra;
        sel.appendChild(o2);
      }
      sel.disabled = false;
    }

    function resetCollege() {
      cl.innerHTML = '<option value="">Select a city first</option>';
      cl.disabled = true;
      S.college = '';
      S.collegeOther = '';
      $('#collegeOtherWrap').hidden = true;
      $('#collegeOther').value = '';
      setNeutral('college');
    }

    on(st, 'change', function () {
      S.state = st.value;
      var hadCity = !!S.city;
      S.city = '';
      if (!st.value) {
        ct.innerHTML = '<option value="">Select a state first</option>';
        ct.disabled = true;
        resetCollege();
        setNeutral('city');
        setErr('state', 'Choose the state you live in.');
        return;
      }
      setOk('state', true);
      fill(ct, D.cities(st.value), 'Select your city');
      resetCollege();
      setNeutral('city');
      if (hadCity && !restoring) toast('info', 'City reset', 'Pick a city in ' + st.value + ' — the list has changed.', 3200);
      saveDraft();
    });

    on(ct, 'change', function () {
      S.city = ct.value;
      if (!ct.value) { setErr('city', 'Choose your city.'); resetCollege(); return; }
      setOk('city', true);
      fill(cl, D.colleges(S.state, ct.value), 'Select your college', 'Other / not listed');
      $('#collegeOtherWrap').hidden = true;
      S.college = '';
      saveDraft();
    });

    on(cl, 'change', function () {
      S.college = cl.value;
      var other = cl.value === '__other';
      $('#collegeOtherWrap').hidden = !other;
      if (other) setTimeout(function () { $('#collegeOther').focus(); }, 60);
      setNeutral('college');
      saveDraft();
    });

    on($('#collegeOther'), 'input', function () {
      S.collegeOther = this.value;
      setNeutral('college');
      saveDraft();
    });
  })();

  (function () {
    var input = $('#phone'), touched = false;

    function format(v) {
      var d = v.replace(/\D/g, '').slice(0, 10);
      return d.length > 5 ? d.slice(0, 5) + ' ' + d.slice(5) : d;
    }

    on(input, 'input', function () {
      var caretAtEnd = input.selectionStart === input.value.length;
      input.value = format(input.value);
      if (caretAtEnd) input.setSelectionRange(input.value.length, input.value.length);
      S.phone = input.value.replace(/\D/g, '');
      if (!touched) return;
      var msg = V.phone(input.value);
      msg ? setErr('phone', msg) : setOk('phone');
      saveDraft();
    });

    on(input, 'keypress', function (e) {
      if (e.key && e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
    });

    on(input, 'blur', function () {
      touched = true;
      if (!input.value) { setNeutral('phone'); return; }
      var msg = V.phone(input.value);
      msg ? setErr('phone', msg) : setOk('phone');
    });
  })();

  on($('#formPlace'), 'submit', function (e) {
    e.preventDefault();
    var bad = [];

    if (!$('#state').value) { setErr('state', 'Choose the state you live in.'); bad.push('state'); } else setOk('state', true);
    if (!$('#city').value) { setErr('city', 'Choose your city.'); bad.push('city'); } else setOk('city', true);

    if ($('#college').value === '__other' && !$('#collegeOther').value.trim()) {
      setErr('college', 'Type your college name, or pick one from the list.');
      bad.push('college');
    } else setOk('college', true);

    var phoneMsg = V.phone($('#phone').value);
    if (phoneMsg) { setErr('phone', phoneMsg); bad.push('phone'); } else setOk('phone');

    if (bad.length) { failSubmit(bad); return; }

    S.state = $('#state').value;
    S.city = $('#city').value;
    S.college = $('#college').value === '__other' ? $('#collegeOther').value.trim() : $('#college').value;
    S.phone = $('#phone').value.replace(/\D/g, '');
    saveDraft();

    var btn = $('button[type="submit"]', this);
    btn.classList.add('is-loading');
    btn.disabled = true;
    net(true).then(function () {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      goStep(4, 'fwd');
    });
  });

  wireCounter('username', 20);
  wireCounter('bio', 150);

  var MAX_INTERESTS = 6, MIN_INTERESTS = 3;

  (function () {
    var wrap = $('#interestChips');
    D.INTERESTS.forEach(function (it) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.val = it.label;
      b.setAttribute('aria-pressed', 'false');
      b.textContent = it.emoji + '  ' + it.label;
      wrap.appendChild(b);
    });

    function paint() {
      var n = S.interests.length;
      $('#interestCount').textContent = n + '/' + MAX_INTERESTS + ' · pick at least ' + MIN_INTERESTS;
      $$('.chip', wrap).forEach(function (c) {
        var on_ = S.interests.indexOf(c.dataset.val) > -1;
        c.classList.toggle('is-on', on_);
        c.setAttribute('aria-pressed', on_ ? 'true' : 'false');
        c.classList.toggle('is-off', !on_ && n >= MAX_INTERESTS);
      });
    }

    on(wrap, 'click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var v = chip.dataset.val, i = S.interests.indexOf(v);
      if (i > -1) S.interests.splice(i, 1);
      else if (S.interests.length >= MAX_INTERESTS) {
        toast('info', 'That is a full plate', 'Pick up to ' + MAX_INTERESTS + ' themes — deselect one to swap.', 3000);
        return;
      } else S.interests.push(v);
      if (S.interests.length >= MIN_INTERESTS) setNeutral('interests');
      paint();
      saveDraft();
    });

    window.__paintInterests = paint;
    paint();
  })();

  var checkHandle = debounce(function (v) {
    var f = field('username');
    f.classList.add('is-checking');
    net(true).then(function () {
      if ($('#username').value.trim() !== v) return;
      f.classList.remove('is-checking');
      if (D.TAKEN_HANDLES.indexOf(v) > -1) {
        setErr('username', '@' + v + ' is taken. Try @' + v + Math.floor(10 + Math.random() * 89) + '.');
      } else {
        setOk('username');
        S.username = v;
        saveDraft();
      }
    });
  }, 600);

  (function () {
    var input = $('#username');
    on(input, 'input', function () {
      input.value = input.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      var v = input.value.trim();
      S.username = v;
      var msg = V.username(v);
      if (!v) { setNeutral('username'); return; }
      if (msg) { setErr('username', msg); return; }
      setNeutral('username');
      field('username').classList.add('is-checking');
      checkHandle(v);
    });
  })();

  (function () {
    var input = $('#bio');
    on(input, 'input', function () {
      S.bio = input.value;
      var msg = V.bio(input.value);
      msg ? setErr('bio', msg) : setNeutral('bio');
      saveDraft();
    });
  })();

  on($('#btnRetry'), 'click', function () { $('#formVibe').requestSubmit(); });

  on($('#formVibe'), 'submit', function (e) {
    e.preventDefault();
    var bad = [];
    $('#submitBanner').hidden = true;

    var uMsg = V.username($('#username').value);
    if (uMsg) { setErr('username', uMsg); bad.push('username'); }
    else if (D.TAKEN_HANDLES.indexOf($('#username').value.trim()) > -1) {
      setErr('username', 'That handle is taken — pick another.');
      bad.push('username');
    } else setOk('username');

    if (S.interests.length < MIN_INTERESTS) {
      setErr('interests', 'Pick at least ' + MIN_INTERESTS + ' — it is how we match you to parties.');
      bad.push('interests');
    } else setOk('interests', true);

    var bMsg = V.bio($('#bio').value);
    if (bMsg) { setErr('bio', bMsg); bad.push('bio'); } else setOk('bio', true);

    if (bad.length) { failSubmit(bad); return; }

    S.bio = $('#bio').value.trim();
    saveDraft();

    var btn = $('#btnFinish');
    btn.classList.add('is-loading');
    btn.disabled = true;
    $('#btnFinish .btn__label').textContent = 'Creating your profile';

    net().then(function () {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      $('#btnFinish .btn__label').textContent = 'Create my profile';

      if (OPTS.failSubmit) {
        var banner = $('#submitBanner');
        banner.hidden = false;
        banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast('err', 'Profile not created', 'The request timed out. Your details are still here.', 5000);
        return;
      }
      finishSignup();
    });
  });
  function pronounLabel() {
    return S.pronouns === 'custom' ? S.pronounCustom : S.pronouns;
  }

  function finishSignup() {
    var first = (S.fullName || 'friend').split(' ')[0];
    $('#doneTitle').textContent = "You're in.";
    $('#doneName').textContent = first;
    $('#doneSub').innerHTML = 'Welcome to Extroverts, <strong>' + escapeHtml(first) +
      '</strong>. Your first hangouts in ' + escapeHtml(S.city || 'your city') + ' are already waiting.';

    $('#doneAvatar').textContent = (S.fullName || 'E').charAt(0).toUpperCase();
    $('#cardName').textContent = S.fullName;
    $('#cardHandle').textContent = '@' + S.username + (pronounLabel() ? ' · ' + pronounLabel() : '');
    $('#cardCity').textContent = S.city || '—';
    $('#cardCollege').textContent = S.college || 'Not added';
    $('#cardAge').textContent = S.age ? S.age + ' yrs' : '—';

    var tags = $('#cardTags');
    tags.innerHTML = '';
    S.interests.forEach(function (t) {
      var s = document.createElement('span');
      s.textContent = t;
      tags.appendChild(s);
    });

    $('#profileCard').hidden = false;
    show('done');
    toast('ok', 'Profile created', 'You joined the Bronze Club with 10 Honorary Vibe Tokens.', 5000);
    noSave = true;
    clearDraft();
  }

  function finishLogin() {
    $('#doneTitle').textContent = 'Welcome back.';
    $('#doneSub').innerHTML = 'Signed in as <strong>' + escapeHtml(S.email) + '</strong>. Picking up where you left off.';
    $('#profileCard').hidden = true;
    show('done');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  on($('#doneEnter'), 'click', function () {
    toast('info', 'This is where the app opens', 'The feed is outside the scope of this assessment.', 3600);
  });

  on($('#doneRestart'), 'click', function () { hardReset(); });

  var modalCb = null;

  function openModal(title, body, confirmLabel, cb) {
    $('#modalTitle').textContent = title;
    $('#modalBody').textContent = body;
    $('#modalConfirm').textContent = confirmLabel;
    modalCb = cb;
    $('#modal').hidden = false;
    setTimeout(function () { $('#modalConfirm').focus(); }, 40);
  }

  function closeModal() { $('#modal').hidden = true; modalCb = null; }

  $$('#modal [data-close]').forEach(function (el) { on(el, 'click', closeModal); });
  on($('#modalConfirm'), 'click', function () { var cb = modalCb; closeModal(); if (cb) cb(); });
  on(document, 'keydown', function (e) { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  function setDemoOpen(open) {
    $('.demo__body').hidden = !open;
    $('#demoToggle').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('demo-open', open);
  }

  on($('#demoToggle'), 'click', function () {
    setDemoOpen($('.demo__body').hidden);
  });

  on(document, 'click', function (e) {
    if (!$('.demo__body').hidden && !e.target.closest('#demo')) setDemoOpen(false);
  });
  on($('#optSlow'), 'change', function () { OPTS.slow = this.checked; });
  on($('#optFailOtp'), 'change', function () { OPTS.failOtp = this.checked; });
  on($('#optFailSubmit'), 'change', function () { OPTS.failSubmit = this.checked; });

  on($('#optClear'), 'click', function () {
    clearDraft();
    toast('ok', 'Draft cleared', 'Reload the page to start from a blank slate.');
    syncLandingCta();
  });

  on($('#optFill'), 'click', function () {
    if (S.step === 1 && authPane === 'email') { $('#email').value = 'vaibhav@college.edu'; setOk('email'); }
    if (S.step === 2) {
      $('#fullName').value = 'Vaibhav Singh';
      $('#dobD').value = '26'; $('#dobM').value = '09'; $('#dobY').value = '2006';
      $('#dobY').dispatchEvent(new Event('input'));
      var chip = $('#pronounChips .chip[data-val="He/Him"]');
      chip.click();
      setOk('fullName');
    }
    if (S.step === 3) {
      var st = $('#state'); st.value = 'Uttar Pradesh'; st.dispatchEvent(new Event('change'));
      var ct = $('#city'); ct.value = 'Lucknow'; ct.dispatchEvent(new Event('change'));
      var cl = $('#college'); cl.value = 'SRMU'; cl.dispatchEvent(new Event('change'));
      $('#phone').value = '8957784793';
      $('#phone').dispatchEvent(new Event('input'));
      setOk('phone');
    }
    if (S.step === 4) {
      var u = $('#username'); u.value = 'vaibhavs'; u.dispatchEvent(new Event('input'));
      ['Music Jam', 'Game Night', 'Brunch Outing'].forEach(function (l) {
        var c = $('#interestChips .chip[data-val="' + l + '"]');
        if (c && !c.classList.contains('is-on')) c.click();
      });
      $('#bio').value = 'Will show up for anything with good food and worse karaoke.';
      $('#bio').dispatchEvent(new Event('input'));
    }
    toast('info', 'Autofilled', 'Valid values dropped into this step.', 2200);
  });
  function syncLandingCta() {
    var d = loadDraft();
    var resumable = d && d.emailVerified && d.step > 1;

    $('#ctaSignup .btn__label').textContent = resumable ? 'Continue your signup' : 'Create your account';
    $('#ctaSignup').dataset.resume = resumable ? String(d.step) : '';
  }

  function restore(d) {
    restoring = true;
    Object.keys(d).forEach(function (k) { S[k] = d[k]; });

    $('#email').value = S.email || '';
    $('#fullName').value = S.fullName || '';
    $('#dobD').value = S.dob.d || ''; $('#dobM').value = S.dob.m || ''; $('#dobY').value = S.dob.y || '';
    if (S.dob.y) $('#dobY').dispatchEvent(new Event('input'));

    if (S.pronouns) {
      var chip = $('#pronounChips .chip[data-val="' + S.pronouns + '"]');
      if (chip) chip.click();
      if (S.pronouns === 'custom') $('#pronounCustom').value = S.pronounCustom || '';
    }

    if (S.state) {
      $('#state').value = S.state;
      $('#state').dispatchEvent(new Event('change'));
      if (S.city) {
        $('#city').value = S.city;
        $('#city').dispatchEvent(new Event('change'));
        if (S.college) {
          var opt = $('#college option[value="' + CSS.escape(S.college) + '"]');
          if (opt) { $('#college').value = S.college; }
          else { $('#college').value = '__other'; $('#collegeOtherWrap').hidden = false; $('#collegeOther').value = S.college; }
        }
      }
    }
    if (S.phone) { $('#phone').value = S.phone.replace(/(\d{5})(\d+)/, '$1 $2'); }
    if (S.username) { $('#username').value = S.username; }
    if (S.bio) { $('#bio').value = S.bio; $('#bio').dispatchEvent(new Event('input')); }
    if (window.__paintInterests) window.__paintInterests();
    $('#interestCount').textContent = S.interests.length + '/6 · pick at least 3';
    restoring = false;
  }

  function hardReset() {
    clearDraft();
    location.reload();
  }

  on($('#ctaSignup'), 'click', function () {
    var resume = this.dataset.resume;
    if (resume) {
      var d = loadDraft();
      if (d) restore(d);
      show('wizard');
      goStep(+resume, 'fwd');
      toast('info', 'Picking up where you left off', 'We kept everything you had already filled in.');
      return;
    }
    setMode('signup');
    openTerms('signup');
  });

  on($('#ctaLogin'), 'click', function () {
    setMode('login');
    show('wizard');
    setPane('email');
    goStep(1, 'fwd');
  });

  (function boot() {
    setMode('signup');
    goStep(1, 'fwd');
    setPane('email');
    show('landing');
    syncLandingCta();

    var d = loadDraft();
    if (d && d.emailVerified && d.step > 1) {
      setTimeout(function () {
        toast('info', 'We saved your progress', 'Step ' + d.step + ' of 4 is waiting for you.', 5000);
      }, 700);
    }
    setTimeout(function () { noSave = false; }, 500);
  })();

})();

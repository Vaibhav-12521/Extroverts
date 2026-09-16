window.DATA = (function () {
  'use strict';

  var PLACES = {
    'Delhi NCR': {
      'New Delhi':  ['Hansraj College', 'Shri Ram College of Commerce', 'Lady Shri Ram College', 'Jamia Millia Islamia', 'IIT Delhi'],
      'Gurugram':   ['Ansal University', 'GD Goenka University', 'SGT University'],
      'Noida':      ['Amity University', 'Shiv Nadar University', 'Bennett University', 'JIIT Noida']
    },
    'Maharashtra': {
      'Mumbai':     ['St. Xavier’s College', 'Jai Hind College', 'NMIMS', 'IIT Bombay', 'KJ Somaiya'],
      'Pune':       ['Fergusson College', 'Symbiosis Institute', 'COEP Technological University', 'MIT WPU'],
      'Nagpur':     ['VNIT Nagpur', 'Hislop College', 'RTM Nagpur University']
    },
    'Karnataka': {
      'Bengaluru':  ['Christ University', 'St. Joseph’s College', 'RV College of Engineering', 'PES University', 'IIM Bangalore'],
      'Mysuru':     ['University of Mysore', 'JSS Science and Technology University'],
      'Mangaluru':  ['NITK Surathkal', 'St. Aloysius College']
    },
    'Telangana': {
      'Hyderabad':  ['IIT Hyderabad', 'Osmania University', 'BITS Pilani Hyderabad', 'ISB Hyderabad', 'St. Francis College'],
      'Warangal':   ['NIT Warangal', 'Kakatiya University']
    },
    'Tamil Nadu': {
      'Chennai':    ['IIT Madras', 'Loyola College', 'Anna University', 'Madras Christian College'],
      'Coimbatore': ['PSG College of Technology', 'Amrita Vishwa Vidyapeetham'],
      'Vellore':    ['VIT Vellore', 'CMC Vellore']
    },
    'Madhya Pradesh': {
      'Bhopal':     ['IISER Bhopal', 'MANIT Bhopal', 'Barkatullah University', 'LNCT Bhopal'],
      'Indore':     ['IIT Indore', 'IIM Indore', 'DAVV Indore'],
      'Gwalior':    ['IIITM Gwalior', 'Jiwaji University']
    },
    'Rajasthan': {
      'Jaipur':     ['MNIT Jaipur', 'University of Rajasthan', 'Manipal University Jaipur'],
      'Udaipur':    ['IIM Udaipur', 'MLSU Udaipur'],
      'Pilani':     ['BITS Pilani']
    },
    'West Bengal': {
      'Kolkata':    ['Presidency University', 'St. Xavier’s College Kolkata', 'Jadavpur University', 'IIM Calcutta'],
      'Durgapur':   ['NIT Durgapur'],
      'Kharagpur':  ['IIT Kharagpur']
    }
  };

  var INTERESTS = [
    { emoji: '🎸', label: 'Music Jam' },
    { emoji: '🍵', label: 'Tea Party' },
    { emoji: '🍽️', label: 'Dinner Event' },
    { emoji: '📚', label: 'Book Club' },
    { emoji: '🥞', label: 'Brunch Outing' },
    { emoji: '🤝', label: 'Networking' },
    { emoji: '🎬', label: 'Movie Squad' },
    { emoji: '💪', label: 'Workout Session' },
    { emoji: '⚽', label: 'Sports FC' },
    { emoji: '🎮', label: 'Game Night' },
    { emoji: '🎤', label: 'Karaoke Night' },
    { emoji: '🧺', label: 'Picnic Day' },
    { emoji: '🎲', label: 'Board Games' },
    { emoji: '✈️', label: 'Travel' },
    { emoji: '💆', label: 'Spa Day' }
  ];

  var TAKEN_HANDLES = ['honey', 'admin', 'extroverts', 'party', 'vibe', 'host', 'himanshusoni', 'test'];

  var REGISTERED = ['member@extroverts.app', 'honey@extroverts.app'];

  return {
    PLACES: PLACES,
    INTERESTS: INTERESTS,
    TAKEN_HANDLES: TAKEN_HANDLES,
    REGISTERED: REGISTERED,
    OTP: '123456',
    states: function () { return Object.keys(PLACES); },
    cities: function (state) { return PLACES[state] ? Object.keys(PLACES[state]) : []; },
    colleges: function (state, city) {
      return (PLACES[state] && PLACES[state][city]) ? PLACES[state][city].slice() : [];
    }
  };
})();

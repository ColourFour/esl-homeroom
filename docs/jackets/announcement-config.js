/* UNAPPROVED DEFAULT. Do not publish or set phase to announced until authorized.
   Never put vote records, codes, tallies, or private information in this file.
   Do not commit the confirmed winner to a public branch before the assembly. */
window.TAIHANG_ANNOUNCEMENT = {
  phase: 'closed',               // 'closed' or 'announced'; manual release only
  winnerDesign: null,             // original ID: 1, 2 or 3
  winnerConfirmed: false,         // true only after outcome is independently confirmed
  purchasingApproved: false,      // true only when ALL commercial terms are approved
  price: null,                    // approved display text including currency
  sizes: [],                      // approved display labels, e.g. supplied size list
  orderDeadline: null,            // approved display text incl. date, time and time zone as applicable
  purchasingInstructions: []      // approved plain-text steps, in order; no HTML
};

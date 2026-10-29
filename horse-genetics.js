
/*
 * Horsedreams Online
 * Hestegenetik – testversion
 *
 * Denne fil håndterer:
 * - Grundfarver
 * - Cream
 * - Dun
 * - Primitive aftegninger
 * - Gråskimmel
 * - Roan
 * - Kombinationer af Dun og Roan
 * - Følgenetik
 *
 * Bemærk:
 * Dette er en forenklet spilmodel. Den er ikke en fuldstændig
 * biologisk model af alle kendte farvegener.
 */

(function () {
  "use strict";

  // --------------------------------------------------
  // 1. TESTHESTENES GENOTYPER
  // --------------------------------------------------

  const horseGenotypes = {
    "S-000001": {
      extension: ["E", "e"],
      agouti: ["A", "a"],
      cream: ["N", "N"],
      dun: ["D", "nd2"],
      gray: ["G", "g"],
      roan: ["rn", "rn"]
    },

    "S-000002": {
      extension: ["E", "e"],
      agouti: ["A", "a"],
      cream: ["N", "N"],
      dun: ["nd2", "nd2"],
      gray: ["g", "g"],
      roan: ["rn", "rn"]
    },

    "S-000003": {
      extension: ["e", "e"],
      agouti: ["a", "a"],
      cream: ["N", "N"],
      dun: ["D", "nd2"],
      gray: ["g", "g"],
      roan: ["Rn", "rn"]
    },

    "S-000004": {
      extension: ["e", "e"],
      agouti: ["a", "a"],
      cream: ["N", "Cr"],
      dun: ["nd2", "nd2"],
      gray: ["g", "g"],
      roan: ["rn", "rn"]
    },

    "S-000005": {
      extension: ["e", "e"],
      agouti: ["a", "a"],
      cream: ["N", "N"],
      dun: ["nd2", "nd2"],
      gray: ["g", "g"],
      roan: ["rn", "rn"]
    },

    "S-000006": {
      extension: ["E", "e"],
      agouti: ["a", "a"],
      cream: ["N", "N"],
      dun: ["nd2", "nd2"],
      gray: ["g", "g"],
      roan: ["rn", "rn"]
    }
  };

  // --------------------------------------------------
  // 2. GENERELLE HJÆLPEFUNKTIONER
  // --------------------------------------------------

  function hasAllele(genotype, locus, allele) {
    if (!genotype || !Array.isArray(genotype[locus])) {
      return false;
    }

    return genotype[locus].includes(allele);
  }

  function getGenotype(genotype, locus) {
    if (!genotype || !Array.isArray(genotype[locus])) {
      return ["?", "?"];
    }

    return genotype[locus];
  }

  function hasCream(genotype) {
    return hasAllele(genotype, "cream", "Cr");
  }

  function hasDoubleCream(genotype) {
    const cream = getGenotype(genotype, "cream");

    return cream.filter(allele => allele === "Cr").length === 2;
  }

  function hasDun(genotype) {
    return hasAllele(genotype, "dun", "D");
  }

  function hasGray(genotype) {
    return hasAllele(genotype, "gray", "G");
  }

  function hasRoan(genotype) {
    return hasAllele(genotype, "roan", "Rn");
  }

  function hasPrimitiveMarkings(genotype) {
    /*
     * Forenklet model:
     * D-allelen forbindes her med primitive aftegninger.
     *
     * I virkeligheden varierer udtrykket, og andre genetiske
     * faktorer kan også påvirke aftegningerne.
     */
    return hasDun(genotype);
  }

  // --------------------------------------------------
  // 3. HESTENS GRUNDFARVE
  // --------------------------------------------------

  function getBaseColor(genotype) {
    const extension = getGenotype(genotype, "extension");
    const agouti = getGenotype(genotype, "agouti");

    const hasE = extension.includes("E");
    const hasA = agouti.includes("A");

    /*
     * e/e giver rød grundfarve.
     * E/- og A/- giver brun grundfarve.
     * E/- og a/a giver sort grundfarve.
     */

    if (!hasE) {
      return "red";
    }

    if (hasA) {
      return "bay";
    }

    return "black";
  }

  // --------------------------------------------------
  // 4. CREAM-GENET
  // --------------------------------------------------

  function calculateColor(genotype) {
    const baseColor = getBaseColor(genotype);
    const cream = getGenotype(genotype, "cream");

    const creamCount = cream.filter(
      allele => allele === "Cr"
    ).length;

    if (creamCount >= 2) {
      if (baseColor === "red") {
        return "cremello";
      }

      if (baseColor === "bay") {
        return "perlino";
      }

      return "smokyCream";
    }

    if (creamCount === 1) {
      if (baseColor === "red") {
        return "palomino";
      }

      if (baseColor === "bay") {
        return "buckskin";
      }

      return "smokyBlack";
    }

    return baseColor;
  }

  function getColorLabel(color) {
    const labels = {
      red: "Rød",
      bay: "Brun",
      black: "Sort",

      palomino: "Palomino",
      buckskin: "Buckskin",
      smokyBlack: "Smoky Black",

      cremello: "Cremello",
      perlino: "Perlino",
      smokyCream: "Smoky Cream"
    };

    return labels[color] || color;
  }

  // --------------------------------------------------
  // 5. DUN OG ROAN – SAMLET FARVEBETEGNELSE
  // --------------------------------------------------

  function getFinalColorLabel(genotype) {
    const baseColor = getBaseColor(genotype);
    const creamColor = calculateColor(genotype);

    const dun = hasDun(genotype);
    const gray = hasGray(genotype);
    const roan = hasRoan(genotype);
    const cream = hasCream(genotype);

    /*
     * Gråskimmel kan ændre hestens synlige pels med alderen.
     * Den underliggende grundfarve og øvrige gener forsvinder
     * dog ikke, selv om de bliver mindre synlige.
     */
    if (gray) {
      return "Gråskimmel";
    }

    let colorName;

    // Først beregnes grundfarve og eventuel Dun.
    if (dun) {
      if (baseColor === "red") {
        colorName = "Red Dun";
      } else if (baseColor === "bay") {
        colorName = "Bay Dun";
      } else {
        colorName = "Grullo";
      }
    } else {
      colorName = getColorLabel(creamColor);
    }

    /*
     * Cream kan kombineres med Dun.
     * Disse betegnelser er forenklede spilbetegnelser.
     */
    if (cream && dun) {
      if (baseColor === "red") {
        colorName = "Dunalino";
      } else if (baseColor === "bay") {
        colorName = "Dunskin";
      } else {
        colorName = "Dun med Cream";
      }
    }

    /*
     * VIGTIGT:
     * Roan tilføjes til Dun-farven.
     * Roan må ikke overskrive Dun.
     */
    if (roan && dun) {
      colorName += " Roan";
    } else if (roan) {
      const roanNames = {
        red: "Rødskimmel",
        bay: "Brunskimmel",
        black: "Blåskimmel"
      };

      if (!cream) {
        colorName = roanNames[baseColor] || colorName + " Roan";
      } else {
        colorName += " med roan";
      }
    }

    return colorName;
  }

  // --------------------------------------------------
  // 6. GRÅSKIMMEL OG ALDER
  // --------------------------------------------------

  function getGrayStage(ageYears, genotype) {
    if (!hasGray(genotype)) {
      return "Ikke gråskimmel";
    }

    if (ageYears < 1) {
      return "Ung gråskimmel";
    }

    if (ageYears < 4) {
      return "Gråskimmel under udvikling";
    }

    if (ageYears < 8) {
      return "Tiltagende gråskimmel";
    }

    return "Moden gråskimmel";
  }

  // --------------------------------------------------
  // 7. SAMLET PELSUDSEENDE
  // --------------------------------------------------

  function getCoatAppearance(genotype, ageYears = 0) {
    const baseColor = getBaseColor(genotype);
    const creamColor = calculateColor(genotype);

    const dun = hasDun(genotype);
    const gray = hasGray(genotype);
    const roan = hasRoan(genotype);
    const primitiveMarkings = hasPrimitiveMarkings(genotype);

    let coatType = "Ensfarvet";

    if (gray) {
      coatType = "Gråskimmel";
    } else if (dun && roan) {
      coatType = "Dun Roan";
    } else if (dun) {
      coatType = "Dun";
    } else if (roan) {
      coatType = "Roan";
    } else if (hasCream(genotype)) {
      coatType = "Cream";
    }

    return {
      baseColor: baseColor,
      baseColorLabel: getColorLabel(baseColor),

      color: creamColor,
      colorLabel: getColorLabel(creamColor),

      finalColorLabel: getFinalColorLabel(genotype),

      dun: dun,
      dunAlleles: getGenotype(genotype, "dun"),

      primitiveMarkings: primitiveMarkings,

      gray: gray,
      grayStage: getGrayStage(ageYears, genotype),

      roan: roan,

      coatType: coatType,
      ageYears: ageYears
    };
  }

  // --------------------------------------------------
  // 8. NEDARVNING TIL FØL
  // --------------------------------------------------

  function inheritAlleles(parentAlleles) {
    if (!Array.isArray(parentAlleles) || parentAlleles.length !== 2) {
      return "?";
    }

    const randomIndex = Math.floor(Math.random() * 2);

    return parentAlleles[randomIndex];
  }

  function createFoalGenotype(mother, father) {
    if (!mother || !father) {
      throw new Error(
        "Både hoppens og hingstens genotype skal angives."
      );
    }

    const loci = [
      "extension",
      "agouti",
      "cream",
      "dun",
      "gray",
      "roan"
    ];

    const foal = {};

    loci.forEach(locus => {
      const maternalAllele = inheritAlleles(mother[locus]);
      const paternalAllele = inheritAlleles(father[locus]);

      foal[locus] = [
        maternalAllele,
        paternalAllele
      ];
    });

    return foal;
  }

  // --------------------------------------------------
  // 9. OFFENTLIGT API
  // --------------------------------------------------

  window.HorseGenetics = {
    horseGenotypes,

    hasAllele,
    hasCream,
    hasDoubleCream,
    hasDun,
    hasGray,
    hasRoan,
    hasPrimitiveMarkings,

    getGenotype,
    getBaseColor,
    calculateColor,
    getColorLabel,
    getFinalColorLabel,
    getGrayStage,
    getCoatAppearance,
    createFoalGenotype
  };

  /*
   * Behold også de individuelle globale funktioner,
   * så den eksisterende genetics-test.html fortsat kan
   * kalde dem direkte.
   */
  window.horseGenotypes = horseGenotypes;

  window.hasAllele = hasAllele;
  window.hasCream = hasCream;
  window.hasDoubleCream = hasDoubleCream;
  window.hasDun = hasDun;
  window.hasGray = hasGray;
  window.hasRoan = hasRoan;
  window.hasPrimitiveMarkings = hasPrimitiveMarkings;

  window.getGenotype = getGenotype;
  window.getBaseColor = getBaseColor;
  window.calculateColor = calculateColor;
  window.getColorLabel = getColorLabel;
  window.getFinalColorLabel = getFinalColorLabel;
  window.getGrayStage = getGrayStage;
  window.getCoatAppearance = getCoatAppearance;
  window.createFoalGenotype = createFoalGenotype;

})();

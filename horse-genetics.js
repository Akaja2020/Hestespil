
/*
 * horse-genetics.js
 * Første version af hestespillets skjulte farvegenetik.
 *
 * Understøtter:
 * - Extension (E/e)
 * - Agouti (A/a)
 * - Cream (N/Cr)
 *
 * Grey og roan er endnu ikke implementeret.
 */

window.HorseGenetics = (() => {
  // Skjulte genotyper for gårdens faste heste.
  // Disse data bruges ikke direkte i hestekortenes visning.
  const genetics = {
    "S-000001": {
      extension: ["E", "e"],
      agouti: ["A", "a"],
      cream: ["N", "N"]
    },
    "S-000002": {
      extension: ["E", "e"],
      agouti: ["A", "a"],
      cream: ["N", "N"]
    },
    "S-000003": {
      extension: ["e", "e"],
      agouti: ["a", "a"],
      cream: ["N", "N"]
    },
    "S-000004": {
      extension: ["e", "e"],
      agouti: ["a", "a"],
      cream: ["N", "Cr"]
    },
    "S-000005": {
      extension: ["e", "e"],
      agouti: ["a", "a"],
      cream: ["N", "N"]
    },
    "S-000006": {
      extension: ["E", "e"],
      agouti: ["a", "a"],
      cream: ["N", "N"]
    }
  };

  // Hent en hests skjulte genotype via dens ID.
  function getGenotype(horseId) {
    const genotype = genetics[horseId];

    if (!genotype) {
      throw new Error(
        `Ingen genotype fundet for hest ${horseId}`
      );
    }

    // Returnér en kopi, så interne data ikke ændres ved et uheld.
    return structuredClone(genotype);
  }

  // Bestem grundfarven ud fra Extension og Agouti.
  function getBaseColor(genotype) {
    const [e1, e2] = genotype.extension;
    const [a1, a2] = genotype.agouti;

    // To e-alleler giver rød grundfarve.
    if (e1 === "e" && e2 === "e") {
      return "red";
    }

    // Agouti påvirker kun sort pigment.
    if (a1 === "a" && a2 === "a") {
      return "black";
    }

    return "bay";
  }

  // Beregn synlig grundfarve inkl. Cream-fortynding.
  function calculateColor(genotype) {
    const baseColor = getBaseColor(genotype);
    const creamCount = genotype.cream.filter(
      allele => allele === "Cr"
    ).length;

    if (creamCount === 0) {
      return baseColor;
    }

    if (creamCount === 1) {
      if (baseColor === "red") return "palomino";
      if (baseColor === "bay") return "buckskin";
      return "smoky_black";
    }

    // To Cream-alleler.
    if (baseColor === "red") return "cremello";
    if (baseColor === "bay") return "perlino";
    return "smoky_cream";
  }

  // Træk én tilfældig allel fra hvert locus hos en forælder.
  function inheritLocus(parentAlleles) {
    return parentAlleles[
      Math.floor(Math.random() * parentAlleles.length)
    ];
  }

  // Opret føllets genotype fra to forældres genotyper.
  function createFoalGenotype(parent1, parent2) {
    const child = {};

    for (const locus of ["extension", "agouti", "cream"]) {
      child[locus] = [
        inheritLocus(parent1[locus]),
        inheritLocus(parent2[locus])
      ];
    }

    return child;
  }

  return {
    getGenotype,
    getBaseColor,
    calculateColor,
    createFoalGenotype
  };
})();

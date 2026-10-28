
/*
 * horse-genetics.js
 * Genetikprototype til Horsedreams Online.
 *
 * Gener:
 * Extension: E/e
 * Agouti: A/a
 * Cream: N/Cr
 * Dun: D/nd1/nd2 (forenklet model)
 * Skimmel: G/g
 * Classic Roan: Rn/rn
 *
 * Bemærk:
 * Dette er en spilprototype, ikke en komplet biologisk model.
 */

window.HorseGenetics = (() => {
  const genetics = {
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

  const requiredLoci = [
    "extension",
    "agouti",
    "cream",
    "dun",
    "gray",
    "roan"
  ];

  function copyData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function validateGenotype(genotype) {
    if (!genotype || typeof genotype !== "object") {
      throw new Error("Genotypen mangler eller er ugyldig.");
    }

    for (const locus of requiredLoci) {
      const alleles = genotype[locus];

      if (
        !Array.isArray(alleles) ||
        alleles.length !== 2 ||
        alleles.some(
          allele => typeof allele !== "string" || allele.length === 0
        )
      ) {
        throw new Error(
          `Genet ${locus} skal indeholde præcis to alleler.`
        );
      }
    }

    const allowedAlleles = {
      extension: ["E", "e"],
      agouti: ["A", "a"],
      cream: ["N", "Cr"],
      dun: ["D", "nd1", "nd2"],
      gray: ["G", "g"],
      roan: ["Rn", "rn"]
    };

    for (const locus of requiredLoci) {
      for (const allele of genotype[locus]) {
        if (!allowedAlleles[locus].includes(allele)) {
          throw new Error(
            `Ukendt allel "${allele}" ved genet ${locus}.`
          );
        }
      }
    }

    return true;
  }

  function getGenotype(horseId) {
    const genotype = genetics[horseId];

    if (!genotype) {
      throw new Error(`Ingen genotype fundet for hest ${horseId}.`);
    }

    return copyData(genotype);
  }

  // Grundfarven bestemmes af Extension og Agouti.
  function getBaseColor(genotype) {
    validateGenotype(genotype);

    const [e1, e2] = genotype.extension;
    const [a1, a2] = genotype.agouti;

    // e/e giver rød grundfarve, uanset Agouti.
    if (e1 === "e" && e2 === "e") {
      return "red";
    }

    // E- og a/a giver sort grundfarve.
    if (a1 === "a" && a2 === "a") {
      return "black";
    }

    // E- og mindst én A giver brun/bay grundfarve.
    return "bay";
  }

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

    if (baseColor === "red") return "cremello";
    if (baseColor === "bay") return "perlino";
    return "smoky_cream";
  }

  function hasDominantAllele(genotype, locus, allele) {
    return genotype[locus].includes(allele);
  }

  function hasGray(genotype) {
    validateGenotype(genotype);
    return hasDominantAllele(genotype, "gray", "G");
  }

  function hasRoan(genotype) {
    validateGenotype(genotype);
    return hasDominantAllele(genotype, "roan", "Rn");
  }

  // D giver dun-fortynding.
  function hasDun(genotype) {
    validateGenotype(genotype);
    return hasDominantAllele(genotype, "dun", "D");
  }

  // nd1 uden D kan give primitive aftegn uden dun-fortynding.
  function hasPrimitiveMarkings(genotype) {
    validateGenotype(genotype);

    return (
      !hasDun(genotype) &&
      hasDominantAllele(genotype, "dun", "nd1")
    );
  }

  function getDunAlleleLabel(genotype) {
    validateGenotype(genotype);
    return genotype.dun.join("/");
  }

  function getGrayStage(ageYears) {
    const age = Math.max(0, Number(ageYears) || 0);

    if (age < 1) return "young";
    if (age < 4) return "early";
    if (age < 8) return "intermediate";
    return "light";
  }

  function getGrayStageLabel(stage) {
    const labels = {
      young: "Ung skimmel",
      early: "Tidlig afblegning",
      intermediate: "Tiltagende afblegning",
      light: "Lys skimmel"
    };

    return labels[stage] || "Ukendt stadium";
  }

  function getColorLabel(color) {
    const labels = {
      red: "Rød/fuks",
      bay: "Brun",
      black: "Sort",
      palomino: "Palomino",
      buckskin: "Buckskin",
      smoky_black: "Smoky black",
      cremello: "Cremello",
      perlino: "Perlino",
      smoky_cream: "Smoky cream"
    };

    return labels[color] || "Ukendt farve";
  }

  function getCoatAppearance(genotype, ageYears = 0) {
    validateGenotype(genotype);

    const baseColor = getBaseColor(genotype);
    const color = calculateColor(genotype);
    const gray = hasGray(genotype);
    const roan = hasRoan(genotype);
    const dun = hasDun(genotype);
    const primitiveMarkings =
      dun || hasPrimitiveMarkings(genotype);

    let coatType = "solid";
    let grayStage = null;

    // Vis egenskaberne separat; prioriter kun etiketten.
    if (gray) {
      coatType = "gray";
      grayStage = getGrayStage(ageYears);
    } else if (roan) {
      coatType = "roan";
    } else if (dun) {
      coatType = "dun";
    }

    return {
      baseColor,
      color,
      colorLabel: getColorLabel(color),
      gray,
      roan,
      dun,
      dunAlleles: getDunAlleleLabel(genotype),
      primitiveMarkings,
      coatType,
      grayStage,
      grayStageLabel: gray
        ? getGrayStageLabel(grayStage)
        : null
    };
  }

  function inheritLocus(parentAlleles) {
    return parentAlleles[
      Math.floor(Math.random() * parentAlleles.length)
    ];
  }

  function createFoalGenotype(parent1, parent2) {
    validateGenotype(parent1);
    validateGenotype(parent2);

    const child = {};

    for (const locus of requiredLoci) {
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
    hasGray,
    hasRoan,
    hasDun,
    hasPrimitiveMarkings,
    getGrayStage,
    getGrayStageLabel,
    getCoatAppearance,
    createFoalGenotype
  };
})();

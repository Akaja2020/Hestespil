/*
 * horse-genetics.js
 * Skjult farvegenetik til hestespillet.
 *
 * Gener:
 * Extension: E/e
 * Agouti: A/a
 * Cream: N/Cr
 * Skimmel: G/g
 * Roan: Rn/rn
 *
 * Skimmel og roan er separate fra grundfarven.
 */

window.HorseGenetics = (() => {
	const genetics = {
		"S-000001": {
			extension: ["E", "e"],
			agouti: ["A", "a"],
			cream: ["N", "N"],
			gray: ["G", "g"],
			roan: ["rn", "rn"],
		},

		"S-000002": {
			extension: ["E", "e"],
			agouti: ["A", "a"],
			cream: ["N", "N"],
			gray: ["g", "g"],
			roan: ["rn", "rn"],
		},

		"S-000003": {
			extension: ["e", "e"],
			agouti: ["a", "a"],
			cream: ["N", "N"],
			gray: ["g", "g"],
			roan: ["Rn", "rn"],
		},

		"S-000004": {
			extension: ["e", "e"],
			agouti: ["a", "a"],
			cream: ["N", "Cr"],
			gray: ["g", "g"],
			roan: ["rn", "rn"],
		},

		"S-000005": {
			extension: ["e", "e"],
			agouti: ["a", "a"],
			cream: ["N", "N"],
			gray: ["g", "g"],
			roan: ["rn", "rn"],
		},

		"S-000006": {
			extension: ["E", "e"],
			agouti: ["a", "a"],
			cream: ["N", "N"],
			gray: ["g", "g"],
			roan: ["rn", "rn"],
		},
	};

	function copyData(data) {
		return JSON.parse(JSON.stringify(data));
	}

	function getGenotype(horseId) {
		const genotype = genetics[horseId];

		if (!genotype) {
			throw new Error(`Ingen genotype fundet for hest ${horseId}`);
		}

		return copyData(genotype);
	}

	// Grundfarve før skimmel og roan.
	function getBaseColor(genotype) {
		const [e1, e2] = genotype.extension;
		const [a1, a2] = genotype.agouti;

		if (e1 === "e" && e2 === "e") {
			return "red";
		}

		if (a1 === "a" && a2 === "a") {
			return "black";
		}

		return "bay";
	}

	// Grundfarve inklusive Cream-genet.
	function calculateColor(genotype) {
		const baseColor = getBaseColor(genotype);

		const creamCount = genotype.cream.filter(
			(allele) => allele === "Cr"
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
		return hasDominantAllele(genotype, "gray", "G");
	}

	function hasRoan(genotype) {
		return hasDominantAllele(genotype, "roan", "Rn");
	}

	// Forenklet model for skimmelens udvikling med alderen.
	// Den præcise udvikling varierer fra hest til hest.
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
			light: "Lys skimmel",
		};

		return labels[stage] || "Ukendt stadium";
	}

	// Samlet pelsberegning.
	function getCoatAppearance(genotype, ageYears = 0) {
		const baseColor = getBaseColor(genotype);
		const color = calculateColor(genotype);
		const gray = hasGray(genotype);
		const roan = hasRoan(genotype);

		let coatType = "solid";
		let grayStage = null;

		if (gray) {
			coatType = "gray";
			grayStage = getGrayStage(ageYears);
		} else if (roan) {
			coatType = "roan";
		}

		return {
			baseColor,
			color,
			gray,
			roan,
			coatType,
			grayStage,
			grayStageLabel: gray ? getGrayStageLabel(grayStage) : null,
		};
	}

	function inheritLocus(parentAlleles) {
		return parentAlleles[Math.floor(Math.random() * parentAlleles.length)];
	}

	// Føllet arver én allel fra hver forælder ved hvert gen.
	function createFoalGenotype(parent1, parent2) {
		const child = {};

		for (const locus of ["extension", "agouti", "cream", "gray", "roan"]) {
			if (!parent1[locus] || !parent2[locus]) {
				throw new Error(`Genet ${locus} mangler hos en af forældrene`);
			}

			child[locus] = [
				inheritLocus(parent1[locus]),
				inheritLocus(parent2[locus]),
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
		getGrayStage,
		getGrayStageLabel,
		getCoatAppearance,
		createFoalGenotype,
	};
})();

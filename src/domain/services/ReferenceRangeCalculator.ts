import { LAB_VALUE_DEFAULT_RANGES } from "../../config/LabConfig";
import { UserProfile, Gender } from "../UserProfile";

export interface ReferenceRange {
  min: number;
  max: number;
}

export class ReferenceRangeCalculator {
  calculateReferenceRange(
    labKey: string,
    dateOfAnalysis: Date,
    userProfile: UserProfile | null
  ): ReferenceRange {
    if (!userProfile) {
      return this.getDefaultReferenceRange(labKey);
    }

    const ageAtAnalysis = this.calculateAgeAtDate(
      userProfile.birthDate,
      dateOfAnalysis
    );
    const gender = userProfile.gender;

    return this.getReferenceRangeByAgeAndGender(labKey, ageAtAnalysis, gender);
  }

  private calculateAgeAtDate(birthDate: Date, targetDate: Date): number {
    const birthYear = birthDate.getFullYear();
    const targetYear = targetDate.getFullYear();
    const birthMonth = birthDate.getMonth();
    const targetMonth = targetDate.getMonth();
    const birthDay = birthDate.getDate();
    const targetDay = targetDate.getDate();

    let age = targetYear - birthYear;

    if (
      this.isBirthdayNotYetOccurred(
        birthMonth,
        birthDay,
        targetMonth,
        targetDay
      )
    ) {
      age--;
    }

    return age;
  }

  private isBirthdayNotYetOccurred(
    birthMonth: number,
    birthDay: number,
    targetMonth: number,
    targetDay: number
  ): boolean {
    return (
      targetMonth < birthMonth ||
      (targetMonth === birthMonth && targetDay < birthDay)
    );
  }

  private getReferenceRangeByAgeAndGender(
    labKey: string,
    age: number,
    gender: Gender
  ): ReferenceRange {
    switch (labKey) {
      case "Hematies":
        return this.getRedBloodCellsRange(age, gender);
      case "Hémoglobine":
        return this.getHemoglobinRange(age, gender);
      case "Hématocrite":
        return this.getHematocritRange(age, gender);
      case "VGM":
        return this.getMeanCorpuscularVolumeRange(age, gender);
      case "TCMH":
        return this.getMeanCorpuscularHemoglobinRange(age, gender);
      case "CCMH":
        return this.getMeanCorpuscularHemoglobinConcentrationRange(age, gender);
      case "Leucocytes":
        return this.getWhiteBloodCellsRange(age, gender);
      case "Polynucléaires neutrophiles":
        return this.getNeutrophilsRange(age, gender);
      case "Polynucléaires éosinophiles":
        return this.getEosinophilsRange(age, gender);
      case "Polynucléaires basophiles":
        return this.getBasophilsRange(age, gender);
      case "Lymphocytes":
        return this.getLymphocytesRange(age, gender);
      case "Monocytes":
        return this.getMonocytesRange(age, gender);
      case "Plaquettes":
        return this.getPlateletsRange(age, gender);
      case "Ferritine":
        return this.getFerritinRange(age, gender);
      default:
        return this.getDefaultReferenceRange(labKey);
    }
  }

  private getDefaultReferenceRange(labKey: string): ReferenceRange {
    const defaultRanges = this.getDefaultReferenceRanges();
    return defaultRanges[labKey] || { min: 0, max: 0 };
  }

  private getDefaultReferenceRanges(): Record<string, ReferenceRange> {
    return LAB_VALUE_DEFAULT_RANGES;
  }

  private getRedBloodCellsRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getRedBloodCellsRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getRedBloodCellsRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 4.2, max: 5.6 };
    } else if (age >= 6) {
      return { min: 3.9, max: 5.2 };
    } else if (age >= 2) {
      return { min: 3.9, max: 5.3 };
    } else if (age >= 0.5) {
      return { min: 3.7, max: 5.5 };
    } else if (age >= 0.25) {
      // 3-6 months
      return { min: 3.1, max: 4.5 };
    } else if (age >= 0.167) {
      // 2 months
      return { min: 2.7, max: 4.9 };
    } else if (age >= 0.083) {
      // 1 month
      return { min: 3.0, max: 5.4 };
    } else if (age >= 0.038) {
      // 2 weeks
      return { min: 3.6, max: 6.2 };
    } else if (age >= 0.019) {
      // 1 week
      return { min: 3.9, max: 6.3 };
    } else if (age >= 0.003) {
      // 1-3 days
      return { min: 4.0, max: 6.6 };
    } else {
      return { min: 3.7, max: 7.0 }; // Newborn
    }
  }

  private getRedBloodCellsRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 4.08, max: 5.6 }
      : { min: 3.84, max: 5.12 };
  }

  private getRedBloodCellsRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 4.28, max: 6.0 } : { min: 3.8, max: 5.9 };
  }

  private getHemoglobinRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getHemoglobinRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getHemoglobinRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 12.1, max: 16.6 };
    } else if (age >= 6) {
      return { min: 11.1, max: 14.7 };
    } else if (age >= 2) {
      return { min: 11.0, max: 14.0 };
    } else if (age >= 0.5) {
      return { min: 10.5, max: 13.5 };
    } else if (age >= 0.25) {
      return { min: 9.5, max: 14.1 };
    } else if (age >= 0.167) {
      return { min: 9.0, max: 14.0 };
    } else if (age >= 0.083) {
      return { min: 10.0, max: 18.0 };
    } else if (age >= 0.038) {
      return { min: 12.5, max: 20.5 };
    } else if (age >= 0.019) {
      return { min: 13.5, max: 21.5 };
    } else if (age >= 0.003) {
      return { min: 14.5, max: 22.5 };
    } else {
      return { min: 13.5, max: 23.7 };
    }
  }

  private getHemoglobinRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 12.9, max: 16.7 }
      : { min: 11.8, max: 15.0 };
  }

  private getHemoglobinRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 13.0, max: 18.0 }
      : { min: 11.5, max: 17.5 };
  }

  private getHematocritRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getHematocritRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getHematocritRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 35, max: 49 };
    } else if (age >= 6) {
      return { min: 32, max: 45 };
    } else if (age >= 2) {
      return { min: 32, max: 40 };
    } else if (age >= 0.5) {
      return { min: 30, max: 41 };
    } else if (age >= 0.25) {
      return { min: 29, max: 41 };
    } else if (age >= 0.167) {
      return { min: 28, max: 42 };
    } else if (age >= 0.083) {
      return { min: 31, max: 55 };
    } else if (age >= 0.038) {
      return { min: 39, max: 65 };
    } else if (age >= 0.019) {
      return { min: 42, max: 66 };
    } else if (age >= 0.003) {
      return { min: 45, max: 67 };
    } else {
      return { min: 42, max: 75 };
    }
  }

  private getHematocritRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 38, max: 49 } : { min: 35, max: 45 };
  }

  private getHematocritRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 39, max: 53 } : { min: 34, max: 53 };
  }

  private getMeanCorpuscularVolumeRange(
    age: number,
    gender: Gender
  ): ReferenceRange {
    if (age >= 70) {
      return { min: 83, max: 97 };
    } else if (age >= 15) {
      return this.getMeanCorpuscularVolumeRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 77, max: 98 };
    } else if (age >= 6) {
      return { min: 75, max: 95 };
    } else if (age >= 2) {
      return { min: 72, max: 87 };
    } else if (age >= 0.5) {
      return { min: 68, max: 86 };
    } else if (age >= 0.25) {
      return { min: 68, max: 108 };
    } else if (age >= 0.167) {
      return { min: 77, max: 115 };
    } else if (age >= 0.083) {
      return { min: 85, max: 123 };
    } else if (age >= 0.038) {
      return { min: 86, max: 124 };
    } else if (age >= 0.019) {
      return { min: 88, max: 126 };
    } else if (age >= 0.003) {
      return { min: 92, max: 121 };
    } else {
      return { min: 98, max: 125 };
    }
  }

  private getMeanCorpuscularVolumeRangeForAdults(
    gender: Gender
  ): ReferenceRange {
    return gender === "male" ? { min: 78, max: 98 } : { min: 76, max: 96 };
  }

  private getMeanCorpuscularHemoglobinRange(
    age: number,
    gender: Gender
  ): ReferenceRange {
    if (age >= 70) {
      return this.getMeanCorpuscularHemoglobinRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getMeanCorpuscularHemoglobinRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 25, max: 35 };
    } else if (age >= 6) {
      return { min: 25, max: 33 };
    } else if (age >= 2) {
      return { min: 24, max: 30 };
    } else if (age >= 0.5) {
      return { min: 23, max: 31 };
    } else if (age >= 0.25) {
      return { min: 24, max: 35 };
    } else if (age >= 0.167) {
      return { min: 26, max: 34 };
    } else if (age >= 0.083) {
      return { min: 28, max: 40 };
    } else {
      return { min: 31, max: 37 };
    }
  }

  private getMeanCorpuscularHemoglobinRangeForSeniors(
    gender: Gender
  ): ReferenceRange {
    return gender === "male"
      ? { min: 27.8, max: 33.9 }
      : { min: 27.5, max: 33.2 };
  }

  private getMeanCorpuscularHemoglobinRangeForAdults(
    gender: Gender
  ): ReferenceRange {
    return gender === "male" ? { min: 26, max: 34 } : { min: 24.4, max: 34 };
  }

  private getMeanCorpuscularHemoglobinConcentrationRange(
    age: number,
    gender: Gender
  ): ReferenceRange {
    if (age >= 70) {
      return this.getMeanCorpuscularHemoglobinConcentrationRangeForSeniors(
        gender
      );
    } else if (age >= 15) {
      return this.getMeanCorpuscularHemoglobinConcentrationRangeForAdults(
        gender
      );
    } else if (age >= 12) {
      return { min: 31.0, max: 37.0 };
    } else if (age >= 0.5) {
      return { min: 30.0, max: 37.4 };
    } else if (age >= 0.25) {
      return { min: 30.0, max: 36.0 };
    } else if (age >= 0.083) {
      return { min: 28.1, max: 37.0 };
    } else {
      return { min: 28.0, max: 38.0 };
    }
  }

  private getMeanCorpuscularHemoglobinConcentrationRangeForSeniors(
    gender: Gender
  ): ReferenceRange {
    return gender === "male"
      ? { min: 32.3, max: 36.1 }
      : { min: 31.9, max: 35.9 };
  }

  private getMeanCorpuscularHemoglobinConcentrationRangeForAdults(
    gender: Gender
  ): ReferenceRange {
    return gender === "male"
      ? { min: 31.0, max: 36.5 }
      : { min: 31.0, max: 36.0 };
  }

  private getPlateletsRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getPlateletsRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getPlateletsRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 166, max: 395 };
    } else if (age >= 6) {
      return { min: 166, max: 463 };
    } else if (age >= 2) {
      return { min: 193, max: 558 };
    } else if (age >= 0.167) {
      return { min: 200, max: 550 };
    } else if (age >= 0.083) {
      return { min: 150, max: 400 };
    } else if (age >= 0.038) {
      return { min: 170, max: 500 };
    } else if (age >= 0.019) {
      return { min: 150, max: 400 };
    } else if (age >= 0.003) {
      return { min: 210, max: 500 };
    } else {
      return { min: 150, max: 450 };
    }
  }

  private getPlateletsRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 140, max: 385 } : { min: 177, max: 379 };
  }

  private getPlateletsRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 150, max: 400 } : { min: 150, max: 445 };
  }

  private getWhiteBloodCellsRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getWhiteBloodCellsRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getWhiteBloodCellsRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 3.75, max: 13.0 };
    } else if (age >= 6) {
      return { min: 4.0, max: 14.5 };
    } else if (age >= 2) {
      return { min: 5.0, max: 17.0 };
    } else if (age >= 0.5) {
      return { min: 6.0, max: 17.5 };
    } else if (age >= 0.25) {
      return { min: 6.0, max: 18.0 };
    } else if (age >= 0.167) {
      return { min: 5.0, max: 15.4 };
    } else if (age >= 0.083) {
      return { min: 5.0, max: 20.0 };
    } else if (age >= 0.019) {
      return { min: 5.0, max: 21.0 };
    } else if (age >= 0.003) {
      return { min: 7.0, max: 34.0 };
    } else {
      return { min: 9.0, max: 30.0 };
    }
  }

  private getWhiteBloodCellsRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 3.8, max: 10.0 } : { min: 3.8, max: 9.1 };
  }

  private getWhiteBloodCellsRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 4.0, max: 11.0 }
      : { min: 3.8, max: 11.0 };
  }

  private getNeutrophilsRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getNeutrophilsRangeForSeniors(gender);
    } else if (age >= 15) {
      return { min: 1.4, max: 7.7 };
    } else if (age >= 12) {
      return { min: 1.5, max: 6.3 };
    } else if (age >= 6) {
      return { min: 1.5, max: 8.0 };
    } else if (age >= 2) {
      return { min: 1.5, max: 8.5 };
    } else if (age >= 0.5) {
      return { min: 1.0, max: 8.5 };
    } else if (age >= 0.25) {
      return { min: 1.0, max: 6.0 };
    } else if (age >= 0.167) {
      return { min: 0.7, max: 5.0 };
    } else if (age >= 0.083) {
      return { min: 1.0, max: 9.0 };
    } else if (age >= 0.038) {
      return { min: 1.0, max: 9.5 };
    } else if (age >= 0.019) {
      return { min: 1.5, max: 10.0 };
    } else if (age >= 0.003) {
      return { min: 3.0, max: 21.0 };
    } else {
      return { min: 2.7, max: 26.0 };
    }
  }

  private getNeutrophilsRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 1.6, max: 5.9 } : { min: 1.9, max: 5.7 };
  }

  private getEosinophilsRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getEosinophilsRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getEosinophilsRangeForAdults(gender);
    } else if (age >= 12) {
      return { min: 0.04, max: 0.89 };
    } else if (age >= 6) {
      return { min: 0.05, max: 0.85 };
    } else if (age >= 2) {
      return { min: 0.05, max: 0.8 };
    } else if (age >= 0.5) {
      return { min: 0.1, max: 0.8 };
    } else if (age >= 0.25) {
      return { min: 0.1, max: 1.0 };
    } else if (age >= 0.167) {
      return { min: 0.05, max: 1.0 };
    } else if (age >= 0.083) {
      return { min: 0.2, max: 1.2 };
    } else if (age >= 0.019) {
      return { min: 0.0, max: 0.8 };
    } else if (age >= 0.003) {
      return { min: 0.1, max: 2.0 };
    } else {
      return { min: 0.0, max: 1.0 };
    }
  }

  private getEosinophilsRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 0.03, max: 0.5 }
      : { min: 0.04, max: 0.52 };
  }

  private getEosinophilsRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 0.02, max: 0.63 }
      : { min: 0.02, max: 0.58 };
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private getBasophilsRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return { min: 0.0, max: 0.09 };
    } else if (age >= 15) {
      return { min: 0.0, max: 0.11 };
    } else if (age >= 12) {
      return { min: 0.01, max: 0.23 };
    } else if (age >= 6) {
      return { min: 0.01, max: 0.24 };
    } else if (age >= 2) {
      return { min: 0.02, max: 0.12 };
    } else {
      return { min: 0.0, max: 0.1 };
    }
  }

  private getLymphocytesRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getLymphocytesRangeForSeniors(gender);
    } else if (age >= 15) {
      return { min: 1.0, max: 4.8 };
    } else if (age >= 12) {
      return { min: 1.3, max: 4.5 };
    } else if (age >= 6) {
      return { min: 1.0, max: 7.0 };
    } else if (age >= 2) {
      return { min: 1.5, max: 9.5 };
    } else if (age >= 0.5) {
      return { min: 3.0, max: 13.5 };
    } else if (age >= 0.25) {
      return { min: 4.0, max: 12.0 };
    } else if (age >= 0.167) {
      return { min: 3.0, max: 10.3 };
    } else if (age >= 0.083) {
      return { min: 2.0, max: 16.5 };
    } else {
      return { min: 2.0, max: 17.0 };
    }
  }

  private getLymphocytesRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 1.07, max: 4.1 }
      : { min: 1.07, max: 3.9 };
  }

  private getMonocytesRange(age: number, gender: Gender): ReferenceRange {
    if (age >= 70) {
      return this.getMonocytesRangeForSeniors(gender);
    } else if (age >= 15) {
      return this.getMonocytesRangeForAdults(gender);
    } else if (age >= 6) {
      return { min: 0.15, max: 1.3 };
    } else if (age >= 0.5) {
      return { min: 0.2, max: 1.0 };
    } else if (age >= 0.25) {
      return { min: 0.2, max: 1.2 };
    } else if (age >= 0.167) {
      return { min: 0.36, max: 1.2 };
    } else if (age >= 0.083) {
      return { min: 0.2, max: 1.0 };
    } else if (age >= 0.038) {
      return { min: 0.1, max: 1.7 };
    } else if (age >= 0.019) {
      return { min: 0.2, max: 1.0 };
    } else if (age >= 0.003) {
      return { min: 0.5, max: 1.0 };
    } else {
      return { min: 0.0, max: 2.0 };
    }
  }

  private getMonocytesRangeForSeniors(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 0.23, max: 0.71 }
      : { min: 0.17, max: 0.56 };
  }

  private getMonocytesRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male"
      ? { min: 0.18, max: 1.0 }
      : { min: 0.15, max: 1.0 };
  }

  private getFerritinRange(age: number, gender: Gender): ReferenceRange {
    if (age > 18) {
      return this.getFerritinRangeForAdults(gender);
    } else if (age > 14) {
      return this.getFerritinRangeForAdolescents(gender);
    } else if (age > 5) {
      return { min: 14, max: 79 };
    } else if (age > 1) {
      return { min: 5, max: 100 };
    } else if (age > 0.25) {
      return { min: 8, max: 182 };
    } else {
      return { min: 0, max: 515 };
    }
  }

  private getFerritinRangeForAdults(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 22, max: 275 } : { min: 5, max: 204 };
  }

  private getFerritinRangeForAdolescents(gender: Gender): ReferenceRange {
    return gender === "male" ? { min: 11, max: 172 } : { min: 6, max: 67 };
  }
}

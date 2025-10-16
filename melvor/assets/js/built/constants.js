"use strict";
const LORE = [{
        get title() {
            return getLangString('LORE_TITLE_Futures_Prophecy');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_0_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_0_7')}`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_1');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_1_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_2');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_2_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_3');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_3_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_4');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_4_0')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Unknown_Evil');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_5_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_5_16')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_New_Dawn');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_6_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_6_6')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Beginning_Of_The_End');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_7_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_7_19')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Impending_Darkness');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_8_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_30')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_31')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_32')}<br><br>
					${getLangString('LORE_PARAGRAPH_8_33')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book1');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_9_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_9_29')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book2');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_10_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_10_21')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book3');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_11_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_11_19')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book4');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_12_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_12_30')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book5');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_13_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_30')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_31')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_32')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_33')}<br><br>
					${getLangString('LORE_PARAGRAPH_13_34')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book6');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_14_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_14_16')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book7a');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_15_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_15_17')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book7b');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_16_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_28')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_29')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_30')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_31')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_32')}<br><br>
					${getLangString('LORE_PARAGRAPH_16_33')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book8');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_17_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_17_16')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book9');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_18_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_19')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_20')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_21')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_22')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_23')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_24')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_25')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_26')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_27')}<br><br>
					${getLangString('LORE_PARAGRAPH_18_28')}<br>`;
        },
    },
    {
        get title() {
            return getLangString('LORE_TITLE_Book10');
        },
        get paragraphs() {
            return `${getLangString('LORE_PARAGRAPH_19_0')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_1')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_2')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_3')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_4')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_5')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_6')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_7')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_8')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_9')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_10')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_11')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_12')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_13')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_14')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_15')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_16')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_17')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_18')}<br><br>
					${getLangString('LORE_PARAGRAPH_19_19')}<br>`;
        },
    },
];
//laziness
const PRIVACYPOLICY = `<strong>Privacy Policy for melvoridle.com (Melvor Idle)</strong><br>Effective as of August 3, 2020<br><br>
							As the owner of this website (the "Site"), Malcs ("we" or "us") understand that your privacy is of critical importance.  This Privacy Policy describes what information we collect from you via the Site and how we use and disclose such information.<br><br>
							<strong>Our Use of Cookies</strong><br>
							A cookie is a file containing an identifier (a string of letters and numbers) that is sent by a web server to a web browser and is stored by the browser. The identifier is then sent back to the server each time the browser requests a page from the server. Cookies may be either "persistent" cookies or "session" cookies: a persistent cookie will be stored by a web browser and will remain valid until its set expiry date, unless deleted by the user before the expiry date; a session cookie, on the other hand, will expire at the end of the user session, when the web browser is closed.  Cookies do not typically contain any information that personally identifies a user, but personal information that we store about you may be linked to the information stored in and obtained from cookies.<br><br>
							We use cookies for the following purposes:<br>
							(a) authentication - we use cookies to identify you when you visit our website and as you navigate our website;<br>
							(b) status - we use cookies to help us to determine if you are logged into our website;<br>
							(c) security - we use cookies as an element of the security measures used to protect user accounts, including preventing fraudulent use of login credentials, and to protect our website and services generally;<br>
							(d) advertising - we use cookies to help us to display advertisements that will be relevant to you; and<br>
							(e) analysis - we use cookies [to help us to analyze the use and performance of our website and services;<br><br>
							We use Google Analytics to analyze the use of our website. Google Analytics gathers information about website use by means of cookies. The information gathered relating to our website is used to create reports about the use of our website. Google's privacy policy is available at: https://www.google.com/policies/privacy/<br><br>
							Most browsers allow you to refuse to accept cookies and to delete cookies. The methods for doing so vary from browser to browser, and from version to version. You can however obtain up-to-date information about blocking and deleting cookies via these links:<br>
							(a) <a href="https://support.google.com/chrome/answer/95647?hl=en" target="_blank">https://support.google.com/chrome/answer/95647?hl=en</a> (Chrome);<br>
							(b) <a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank">https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences</a> (Firefox);<br>
							(c) <a href="http://www.opera.com/help/tutorials/security/cookies/" target="_blank">http://www.opera.com/help/tutorials/security/cookies/</a> (Opera);<br>
							(d) <a href="https://support.microsoft.com/en-gb/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank">https://support.microsoft.com/en-gb/help/17442/windows-internet-explorer-delete-manage-cookies</a> (Internet Explorer);<br>
							(e) <a href="https://support.apple.com/kb/PH21411" target="_blank">https://support.apple.com/kb/PH21411</a> (Safari); and<br>
							(f) <a href="https://privacy.microsoft.com/en-us/windows-10-microsoft-edge-and-privacy" target="_blank">https://privacy.microsoft.com/en-us/windows-10-microsoft-edge-and-privacy</a> (Edge).<br><br>
							Please note that blocking cookies may have a negative impact on the functions of many websites, including our Site. Some features of the Site may cease to be available to you.<br><br>
							<strong>Log Files</strong><br>
							As with most other websites, we collect and use the data contained in log files. The information in the log files include your IP (internet protocol) address, your ISP (internet service provider), the browser you used to visit our site (such as Google Chrome or Firefox), the time you visited our site and which pages you visited throughout our site.<br><br>
							<strong>Cookies and Web Beacons</strong><br>
							We use third party advertisements on melvoridle.com to support our site. Some of these advertisers may use technology such as cookies and web beacons when they advertise on our site, which will also send these advertisers (such as Google through the Google AdSense program) information including your IP address, your ISP , the browser you used to visit our site, and in some cases, whether you have Flash installed. This is generally used for geotargeting purposes (showing New York real estate ads to someone in New York, for example) or showing certain ads based on specific sites visited (such as showing cooking ads to someone who frequents cooking sites).<br><br>
							You can choose to disable or selectively turn off our cookies or third-party cookies in your browser settings, or by managing preferences in your browser. However, this can affect how you are able to interact with our site as well as other websites. This could include the inability to login to services or programs, such as logging into forums or accounts.<br><br>
							<strong>Advertising Privacy Statement</strong><br>
                            This Site is affiliated with CMI Marketing, Inc., d/b/a CafeMedia ("CafeMedia") for the purposes of placing advertising on the Site, and CafeMedia will collect and use certain data for advertising purposes. To learn more about CafeMedia's data usage, click here: <a href="www.cafemedia.com/publisher-advertising-privacy-policy" target="_blank">www.cafemedia.com/publisher-advertising-privacy-policy</a><br><br>
							<strong>For European Economic Area Residents</strong><br>
							If you reside in a country in the European Economic Area (EEA), then under the GDPR and applicable data protection laws you have the rights, among other things, to access your personal data, have us erase it, and/or restrict its further processing.  If you wish to access or delete your personal data (if any) maintained by us or AdThrive related to advertising on the Site, you can contact us at **insert contact email address here** or contact AdThrive at info@adthrive.com. If you wish to see a list of the advertising partners we work with or change which of those partners track your behavior using cookies, click the ad preferences link at the bottom of the site. (Available in the EU.)<br><br>
							<strong>For California Residents</strong><br>
							California law gives residents the right to opt out of the "sale" of their personal information to third parties, including for advertising purposes. Under California law, the sharing of your information with a service provider for advertising purposes could be considered a "sale." To opt out of the sharing of your information for advertising information, [if not infinite scroll: click the opt out link provided in the footer of this page] [if infinite scroll: click the opt out link provided at the end of the post]. You also have the right to request from us the categories of personal information that we have shared and the categories of third parties to whom the information was provided. To make such a request, please contact us at info@adthrive.com. To be clear we do not share your name, contact information, or any other sensitive information with third parties, and the categories of third parties that we share information with for advertising purposes are supply side platforms, programmatic advertising exchanges, and demand side platforms.<br><br>				
							<strong>Changes to the Privacy Policy</strong><br>
							We may change this Privacy Policy from time to time. The most recent version of the Privacy Policy will always be posted on the Site, with the "Effective Date" posted at the top of the Policy. We may revise and update this Privacy Policy if our practices change, as technology changes, or as we add new services or change existing ones. If we make any material changes to our Privacy Policy or how we handle your personal information, or we are going to use any personal information in a manner that is materially different from that stated in our Privacy Policy at the time we collected such information, we will give you a reasonable opportunity to consent to the change. If you do not consent, your personal information will be used as agreed to under the terms of the privacy policy in effect at the time we obtained that information. By using our Site or services after the Effective Date, you are deemed to consent to our then-current privacy policy. We will use information previously obtained in accordance with the Privacy Policy in effect when the information was obtained from you.</small>`;
const allVars = [
    'firstTime',
    'username',
    'nameChanges',
    'gp',
    'currentBankUpgrade',
    'skillXP',
    'skillLevel',
    'nextLevelProgress',
    'treeMasteryData',
    'currentAxe',
    'treeCutLimit',
    'bank',
    'bankMax',
    'ignoreBankFull',
    'statsGeneral',
    'statsWoodcutting',
    'logsMastery',
    'statsFiremaking',
    'fishMastery',
    'currentRod',
    'statsFishing',
    'cookingMastery',
    'upgradedToRange',
    'statsCooking',
    'defaultPageOnLoad',
    'miningOreMastery',
    'statsMining',
    'currentPickaxe',
    'statsSmithing',
    'levelUpScreen',
    'gameUpdateNotification',
    'equippedItems',
    'attackStyle',
    'combatData',
    'currentCombatFood',
    'equippedFood',
    'smithingMastery',
    'statsCombat',
    'continueThievingOnStun',
    'thievingMastery',
    'farmingMastery',
    'showItemNotify',
    'glovesTracker',
    'currentCookingFire',
    'rockData',
    'fletchingMastery',
    'craftingMastery',
    'ammo',
    'myBankVersion',
    'statsThieving',
    'statsFarming',
    'statsFletching',
    'statsCrafting',
    'autoRestartDungeon',
    'autoSaveCloud',
    'selectedSpell',
    'runecraftingMastery',
    'darkMode',
    'buyQty',
    'itemLog',
    'dungeonCompleteCount',
    'sellQty',
    'statsRunecrafting',
    'showGPNotify',
    'enableAccessibility',
    'showSkillNav',
    'accountGameVersion',
    'prayerPoints',
    'slayerCoins',
    'slayerTask',
    'showEnemySkillLevels',
    'monsterStats',
    'itemStats',
    'confirmationOnClose',
    'herbloreMastery',
    'newFarmingAreas',
    'equipmentSets',
    'selectedEquipmentSet',
    'currentAutoEat',
    'equipmentSetsPurchased',
    'herbloreBonuses',
    'autoPotion',
    'showHPNotify',
    'statsHerblore',
    'offline',
    'selectedAttackStyle',
    'showCommas',
    'showVirtualLevels',
    'formatNumberSetting',
    'tutorialTips',
    'saveTimestamp',
    'secretAreaUnlocked',
    'equipmentSwapPurchased',
    'godUpgrade',
    'lockedItems',
    'showSaleNotifications',
    'showShopNotifications',
    'pauseOfflineActions',
    'showCombatMinibar',
    'showCombatMinibarCombat',
    'activeAurora',
    'currentGamemode',
    'petUnlocked',
    'showSkillMinibar',
    'saveStateBeforeRaid',
    'golbinRaidHistory',
    'golbinRaidStats',
    'raidCoins',
    'disableAds',
    'SETTINGS',
    'MASTERY',
    'useCombinationRunes',
    'firstTimeLoad',
    'slayerTaskCompletion',
    'autoSlayerUnlocked',
    'autoSlayer',
    'itemsAlreadyFound',
    'xmasPresents',
    'shopItemsPurchased',
    'titleNewsID',
    'chosenAgilityObstacles',
    'skillsUnlocked',
    'agilityObstacleBuildCount',
    'agilityPassivePillarActive',
    'scheduledPushNotifications',
    'randomModifiers',
    'summoningData',
    'cookingStockpiles',
    'activeAstrologyModifiers',
    'tutorialProgress',
    'tutorialComplete',
    'completedTasks',
    'activeTasks',
    'plantAllSelected',
    'christmas2021Progress',
    'christmas2021PresentProgress',
    'bankTabIcons',
    'customMinibarItems',
];
//# sourceMappingURL=constants.js.map
checkFileVersion('?12097')
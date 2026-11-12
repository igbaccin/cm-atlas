# Counting rules

Run made on the laptop. Scope counts refer to a single territory, year, measure and printed item with the other dimensions named in the builder. Repeated overlays are not included in these primary counts. Figures count source numeric cells; the all-population view repeats selected cells by design and must never be added to its population components.

| Territory | Rule | Scopes | Figures | Reading |
| --- | --- | ---: | ---: | --- |
| zambia | source_repeat_excluded | 7 | 664 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| zambia | non_count_measures_excluded | 1 | 98 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| zambia | duplicate_address | 0 | 0 | First identical source cell retained. |
| zambia | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| zambia | subannual_sum | 110 | 110 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| zambia | sex_printed_total | 29449 | 29449 | Printed total replaces its parts; numeric totals only. |
| zambia | sex_sum_parts | 263 | 522 | No printed total; sum the non-overlapping parts. |
| zambia | parallel_columns | 0 | 0 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| zambia | parallel_injury_views | 0 | 0 | Retain nature of injury where both classifications describe the same patients (N06). |
| zambia | overlapping_publications | 201 | 201 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| zambia | places_printed_total | 20049 | 20049 | Printed total replaces its parts; numeric totals only. |
| zambia | places_sum_parts | 7078 | 9721 | No printed total; sum the non-overlapping parts. |
| zambia | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| zambia | institutions_printed_total | 19314 | 19314 | Printed total replaces its parts; numeric totals only. |
| zambia | institutions_sum_parts | 7813 | 10456 | No printed total; sum the non-overlapping parts. |
| zambia | population_printed_all | 0 | 0 | All-population margin uses its numeric printed total. |
| zambia | population_sum | 21024 | 29770 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| zambia | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| zambia | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| bechuanaland | source_repeat_excluded | 0 | 0 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| bechuanaland | non_count_measures_excluded | 1 | 1 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| bechuanaland | duplicate_address | 0 | 0 | First identical source cell retained. |
| bechuanaland | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| bechuanaland | subannual_sum | 55 | 55 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| bechuanaland | sex_printed_total | 14740 | 14740 | Printed total replaces its parts; numeric totals only. |
| bechuanaland | sex_sum_parts | 4964 | 9737 | No printed total; sum the non-overlapping parts. |
| bechuanaland | parallel_columns | 0 | 0 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| bechuanaland | parallel_injury_views | 0 | 0 | Retain nature of injury where both classifications describe the same patients (N06). |
| bechuanaland | overlapping_publications | 0 | 0 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| bechuanaland | places_printed_total | 24477 | 24477 | Printed total replaces its parts; numeric totals only. |
| bechuanaland | places_sum_parts | 0 | 0 | No printed total; sum the non-overlapping parts. |
| bechuanaland | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| bechuanaland | institutions_printed_total | 3461 | 3461 | Printed total replaces its parts; numeric totals only. |
| bechuanaland | institutions_sum_parts | 21016 | 21016 | No printed total; sum the non-overlapping parts. |
| bechuanaland | population_printed_all | 24477 | 24477 | All-population margin uses its numeric printed total. |
| bechuanaland | population_sum | 0 | 0 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| bechuanaland | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| bechuanaland | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| zanzibar | source_repeat_excluded | 19 | 1450 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| zanzibar | non_count_measures_excluded | 0 | 0 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| zanzibar | duplicate_address | 0 | 0 | First identical source cell retained. |
| zanzibar | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| zanzibar | subannual_sum | 3772 | 3772 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| zanzibar | sex_printed_total | 44366 | 44366 | Printed total replaces its parts; numeric totals only. |
| zanzibar | sex_sum_parts | 0 | 0 | No printed total; sum the non-overlapping parts. |
| zanzibar | parallel_columns | 0 | 0 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| zanzibar | parallel_injury_views | 0 | 0 | Retain nature of injury where both classifications describe the same patients (N06). |
| zanzibar | overlapping_publications | 145 | 145 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| zanzibar | places_printed_total | 38512 | 38515 | Printed total replaces its parts; numeric totals only. |
| zanzibar | places_sum_parts | 5513 | 5706 | No printed total; sum the non-overlapping parts. |
| zanzibar | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| zanzibar | institutions_printed_total | 40210 | 40231 | Printed total replaces its parts; numeric totals only. |
| zanzibar | institutions_sum_parts | 3815 | 3990 | No printed total; sum the non-overlapping parts. |
| zanzibar | population_printed_all | 35716 | 35719 | All-population margin uses its numeric printed total. |
| zanzibar | population_sum | 5670 | 8502 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| zanzibar | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| zanzibar | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| uganda | source_repeat_excluded | 22 | 7669 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| uganda | non_count_measures_excluded | 36 | 51 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| uganda | duplicate_address | 0 | 0 | First identical source cell retained. |
| uganda | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| uganda | subannual_sum | 0 | 0 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| uganda | sex_printed_total | 51874 | 53956 | Printed total replaces its parts; numeric totals only. |
| uganda | sex_sum_parts | 3836 | 7667 | No printed total; sum the non-overlapping parts. |
| uganda | parallel_columns | 555 | 2082 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| uganda | parallel_injury_views | 14 | 49 | Retain nature of injury where both classifications describe the same patients (N06). |
| uganda | overlapping_publications | 0 | 0 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| uganda | places_printed_total | 59058 | 59079 | Printed total replaces its parts; numeric totals only. |
| uganda | places_sum_parts | 3 | 6 | No printed total; sum the non-overlapping parts. |
| uganda | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| uganda | institutions_printed_total | 25145 | 25157 | Printed total replaces its parts; numeric totals only. |
| uganda | institutions_sum_parts | 33916 | 33928 | No printed total; sum the non-overlapping parts. |
| uganda | population_printed_all | 45604 | 45622 | All-population margin uses its numeric printed total. |
| uganda | population_sum | 3144 | 6362 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| uganda | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| uganda | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| congo | source_repeat_excluded | 0 | 0 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| congo | non_count_measures_excluded | 0 | 0 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| congo | duplicate_address | 0 | 0 | First identical source cell retained. |
| congo | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| congo | subannual_sum | 0 | 0 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| congo | sex_printed_total | 8151 | 8151 | Printed total replaces its parts; numeric totals only. |
| congo | sex_sum_parts | 0 | 0 | No printed total; sum the non-overlapping parts. |
| congo | parallel_columns | 0 | 0 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| congo | parallel_injury_views | 0 | 0 | Retain nature of injury where both classifications describe the same patients (N06). |
| congo | overlapping_publications | 238 | 714 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| congo | places_printed_total | 1356 | 1356 | Printed total replaces its parts; numeric totals only. |
| congo | places_sum_parts | 10 | 60 | No printed total; sum the non-overlapping parts. |
| congo | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| congo | institutions_printed_total | 34 | 34 | Printed total replaces its parts; numeric totals only. |
| congo | institutions_sum_parts | 1332 | 1382 | No printed total; sum the non-overlapping parts. |
| congo | population_printed_all | 34 | 34 | All-population margin uses its numeric printed total. |
| congo | population_sum | 836 | 1382 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| congo | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| congo | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| gold_coast | source_repeat_excluded | 6 | 616 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| gold_coast | non_count_measures_excluded | 13 | 220 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| gold_coast | duplicate_address | 0 | 0 | First identical source cell retained. |
| gold_coast | annual_over_subannual | 798 | 9576 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| gold_coast | subannual_sum | 13417 | 13417 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| gold_coast | sex_printed_total | 61081 | 61081 | Printed total replaces its parts; numeric totals only. |
| gold_coast | sex_sum_parts | 11771 | 23225 | No printed total; sum the non-overlapping parts. |
| gold_coast | parallel_columns | 0 | 0 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| gold_coast | parallel_injury_views | 36 | 918 | Retain nature of injury where both classifications describe the same patients (N06). |
| gold_coast | overlapping_publications | 0 | 0 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| gold_coast | places_printed_total | 71732 | 71796 | Printed total replaces its parts; numeric totals only. |
| gold_coast | places_sum_parts | 4152 | 11472 | No printed total; sum the non-overlapping parts. |
| gold_coast | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| gold_coast | institutions_printed_total | 46469 | 46533 | Printed total replaces its parts; numeric totals only. |
| gold_coast | institutions_sum_parts | 29415 | 36735 | No printed total; sum the non-overlapping parts. |
| gold_coast | population_printed_all | 74012 | 81396 | All-population margin uses its numeric printed total. |
| gold_coast | population_sum | 1872 | 1872 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| gold_coast | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| gold_coast | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| tanganyika | source_repeat_excluded | 10 | 14762 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| tanganyika | non_count_measures_excluded | 69 | 9419 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| tanganyika | duplicate_address | 0 | 0 | First identical source cell retained. |
| tanganyika | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| tanganyika | subannual_sum | 29348 | 55565 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| tanganyika | sex_printed_total | 87787 | 87787 | Printed total replaces its parts; numeric totals only. |
| tanganyika | sex_sum_parts | 3 | 4 | No printed total; sum the non-overlapping parts. |
| tanganyika | parallel_columns | 0 | 0 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| tanganyika | parallel_injury_views | 0 | 0 | Retain nature of injury where both classifications describe the same patients (N06). |
| tanganyika | overlapping_publications | 0 | 0 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| tanganyika | places_printed_total | 80728 | 87791 | Printed total replaces its parts; numeric totals only. |
| tanganyika | places_sum_parts | 0 | 0 | No printed total; sum the non-overlapping parts. |
| tanganyika | institutions_cross_kind_total | 7063 | 14015 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| tanganyika | institutions_printed_total | 0 | 0 | Printed total replaces its parts; numeric totals only. |
| tanganyika | institutions_sum_parts | 73741 | 73776 | No printed total; sum the non-overlapping parts. |
| tanganyika | population_printed_all | 41319 | 41333 | All-population margin uses its numeric printed total. |
| tanganyika | population_sum | 11911 | 11911 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| tanganyika | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| tanganyika | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| malawi | source_repeat_excluded | 1 | 116 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| malawi | non_count_measures_excluded | 41 | 1168 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| malawi | duplicate_address | 0 | 0 | First identical source cell retained. |
| malawi | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| malawi | subannual_sum | 51 | 51 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| malawi | sex_printed_total | 35169 | 35170 | Printed total replaces its parts; numeric totals only. |
| malawi | sex_sum_parts | 9374 | 18514 | No printed total; sum the non-overlapping parts. |
| malawi | parallel_columns | 1 | 1 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| malawi | parallel_injury_views | 0 | 0 | Retain nature of injury where both classifications describe the same patients (N06). |
| malawi | overlapping_publications | 87 | 174 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| malawi | places_printed_total | 39569 | 39701 | Printed total replaces its parts; numeric totals only. |
| malawi | places_sum_parts | 9972 | 13800 | No printed total; sum the non-overlapping parts. |
| malawi | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| malawi | institutions_printed_total | 25985 | 27656 | Printed total replaces its parts; numeric totals only. |
| malawi | institutions_sum_parts | 23556 | 25845 | No printed total; sum the non-overlapping parts. |
| malawi | population_printed_all | 5749 | 6113 | All-population margin uses its numeric printed total. |
| malawi | population_sum | 40182 | 46398 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| malawi | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| malawi | table_measure_in | 1 | 98 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| sierra_leone | source_repeat_excluded | 12 | 2434 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| sierra_leone | non_count_measures_excluded | 3 | 85 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| sierra_leone | duplicate_address | 0 | 0 | First identical source cell retained. |
| sierra_leone | annual_over_subannual | 300 | 6799 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| sierra_leone | subannual_sum | 1567 | 1567 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| sierra_leone | sex_printed_total | 112460 | 112676 | Printed total replaces its parts; numeric totals only. |
| sierra_leone | sex_sum_parts | 23598 | 62728 | No printed total; sum the non-overlapping parts. |
| sierra_leone | parallel_columns | 7790 | 15933 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| sierra_leone | parallel_injury_views | 24 | 612 | Retain nature of injury where both classifications describe the same patients (N06). |
| sierra_leone | overlapping_publications | 0 | 0 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| sierra_leone | places_printed_total | 58867 | 58915 | Printed total replaces its parts; numeric totals only. |
| sierra_leone | places_sum_parts | 27934 | 39583 | No printed total; sum the non-overlapping parts. |
| sierra_leone | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| sierra_leone | institutions_printed_total | 0 | 0 | Printed total replaces its parts; numeric totals only. |
| sierra_leone | institutions_sum_parts | 86801 | 98498 | No printed total; sum the non-overlapping parts. |
| sierra_leone | population_printed_all | 19646 | 21875 | All-population margin uses its numeric printed total. |
| sierra_leone | population_sum | 41954 | 75792 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| sierra_leone | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| sierra_leone | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| kenya | source_repeat_excluded | 128 | 204 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| kenya | non_count_measures_excluded | 4 | 114 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| kenya | duplicate_address | 0 | 0 | First identical source cell retained. |
| kenya | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| kenya | subannual_sum | 0 | 0 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| kenya | sex_printed_total | 194766 | 194766 | Printed total replaces its parts; numeric totals only. |
| kenya | sex_sum_parts | 2486 | 4968 | No printed total; sum the non-overlapping parts. |
| kenya | parallel_columns | 0 | 0 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| kenya | parallel_injury_views | 0 | 0 | Retain nature of injury where both classifications describe the same patients (N06). |
| kenya | overlapping_publications | 1153 | 1301 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| kenya | places_printed_total | 147439 | 189667 | Printed total replaces its parts; numeric totals only. |
| kenya | places_sum_parts | 0 | 0 | No printed total; sum the non-overlapping parts. |
| kenya | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| kenya | institutions_printed_total | 0 | 0 | Printed total replaces its parts; numeric totals only. |
| kenya | institutions_sum_parts | 147439 | 189667 | No printed total; sum the non-overlapping parts. |
| kenya | population_printed_all | 1016 | 1016 | All-population margin uses its numeric printed total. |
| kenya | population_sum | 53354 | 181053 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| kenya | table_measure_in | 0 | 0 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| kenya | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |
| nigeria | source_repeat_excluded | 146 | 34132 | N15 source_repeat=1: repeated publications excluded from primary cube; optional repeated overlay kept separately. |
| nigeria | non_count_measures_excluded | 23 | 2930 | Keep patient/death count measures, including stocks and attendances; no remarks, costs or durations. |
| nigeria | duplicate_address | 0 | 0 | First identical source cell retained. |
| nigeria | annual_over_subannual | 0 | 0 | Annual columns replace monthly/quarterly columns in the same printed row scope. |
| nigeria | subannual_sum | 4524 | 7985 | Only subannual figures exist; sum printed periods, without filling absent periods. |
| nigeria | sex_printed_total | 228531 | 229780 | Printed total replaces its parts; numeric totals only. |
| nigeria | sex_sum_parts | 16702 | 33404 | No printed total; sum the non-overlapping parts. |
| nigeria | parallel_columns | 1249 | 1249 | Same printed measure/sex/period: prefer current, patient counts, then leftmost column; do not add overlapping attendances. |
| nigeria | parallel_injury_views | 27 | 540 | Retain nature of injury where both classifications describe the same patients (N06). |
| nigeria | overlapping_publications | 0 | 0 | Same printed item/scope/year/period: current, fullest, then first source table; retain every distinct row of that table after repeat flags and row-kind corrections. |
| nigeria | places_printed_total | 131415 | 133817 | Printed total replaces its parts; numeric totals only. |
| nigeria | places_sum_parts | 4901 | 51455 | No printed total; sum the non-overlapping parts. |
| nigeria | institutions_cross_kind_total | 0 | 0 | A total over every kind of institution (Territorial) replaces its government, mission and voluntary parts. |
| nigeria | institutions_printed_total | 0 | 0 | Printed total replaces its parts; numeric totals only. |
| nigeria | institutions_sum_parts | 136316 | 185272 | No printed total; sum the non-overlapping parts. |
| nigeria | population_printed_all | 21760 | 69294 | All-population margin uses its numeric printed total. |
| nigeria | population_sum | 72166 | 115136 | No printed total: sum non-overlapping populations; broad populations suppress their explicitly identified components. |
| nigeria | table_measure_in | 2 | 1547 | Each table counted in its own measure (admitted during year, else treated during year): the year adds tables that print different measures. |
| nigeria | table_measure_out | 0 | 0 | Each table counted in its own measure (treated during year, else admitted during year): the year adds tables that print different measures. |

A printed total with value zero is present and takes precedence. Missing totals do not displace numeric parts. An unlabelled or not-separated margin is treated as the total of its scope. Parallel columns/publications and dual injury classifications use the conservative N06 preference. Broad non-European population margins suppress African/Asian components in the synthetic all view; named populations remain available separately. Different measures remain separate. No admissions/treated fallback is applied because the atlas exposes each measure itself. No missing source value is made zero.

Institution headings are grouped for counting into general, mission, voluntary, military, prison, welfare clinics, rural dispensaries, infant clinics and isolation scopes. Their printed wording is preserved in the source index. Place totals replace individual hospitals within the same institutional kind. All-government or explicitly consolidated hospital headings count as total headings in that kind; an unspecified heading is the conservative unsplit margin. Parallel columns mapped to the same measure prefer current patient/case counts, then first attendances, then attendances, then the leftmost column. Where no preferred count column exists, the leftmost patient-status column is retained; statuses mapped to the same measure are never added together. Source-repeat counts refer to raw line rows, including blank-valued figures; other selection counts refer to numeric source cells.

A heading that totals every kind of institution (Tanganyika's “Territorial”: its government and mission or voluntary agency hospitals together) replaces all of them in its scope (rule institutions_cross_kind_total). Institution kinds are matched as whole words, so that “Admissions” is not read as a mission. Each printed table is counted in its own first measure: in-patients as admissions where the table prints them, otherwise the patients treated; out-patients and combined tables as the patients treated, otherwise admissions (rules table_measure_in and table_measure_out count the years whose tables differ). These three rules date from 12 November 2026, when the atlas was found to count some tables twice.
Men and women: the standard view counts both sexes together, by the printed total where there is one. The same rules are run a second time on the sex columns alone, and give the figures for men and for women where a report prints them apart (the sex switch of the atlas, 12 November 2026); they never enter the standard view.
import { Direction } from '@univerjs/core';
import { Dropdown } from '@univerjs/design';
import { ICellEditorManagerService } from '@univerjs/ui-plugin-sheets';
import { useDependency } from '@wendellhu/redi/react-bindings';
import React, { useEffect, useState } from 'react';

import {
    IFormulaPromptService,
    INavigateParam,
    ISearchFunctionParams,
    ISearchItem,
} from '../../../services/prompt.service';
import styles from './index.module.less';

export function SearchFunction() {
    const [visible, setVisible] = useState(false);
    const [active, setActive] = useState(0);
    const [offset, setOffset] = useState<number[]>([0, 0]);
    const [searchList, setSearchList] = useState<ISearchItem[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const promptService = useDependency(IFormulaPromptService);
    const cellEditorManagerService = useDependency(ICellEditorManagerService);

    useEffect(() => {
        // TODO@Dushusir: How to get updated values in subscribe callback better
        let updatedSearchList: ISearchItem[] = [];
        let updatedActive = 0;
        const subscribeSearch = promptService.search$.subscribe((params: ISearchFunctionParams) => {
            const selection = cellEditorManagerService.getState();
            if (!selection) return;

            const { visible, searchText, searchList } = params;
            if (!visible) {
                setVisible(visible);
                return;
            }

            const { startX = 0, endY = 0 } = selection;

            setSearchText(searchText);
            setSearchList(searchList);
            updatedSearchList = searchList;
            setOffset([startX, endY]);
            setVisible(visible);
            setActive(0); // Reset active state
        });

        const subscribeNavigate = promptService.navigate$.subscribe((params: INavigateParam) => {
            const { direction } = params;
            if (direction === Direction.UP) {
                let nextActive = updatedActive - 1;
                nextActive = nextActive < 0 ? updatedSearchList.length - 1 : nextActive;
                setActive(nextActive);
                updatedActive = nextActive;
            } else if (direction === Direction.DOWN) {
                let nextActive = updatedActive + 1;
                nextActive = nextActive >= updatedSearchList.length ? 0 : nextActive;
                setActive(nextActive);
                updatedActive = nextActive;
            }
        });

        const subscribeAccept = promptService.accept$.subscribe((params: boolean) => {
            const functionName = updatedSearchList[updatedActive].name;
            promptService.acceptFormulaName(functionName);
        });

        return () => {
            subscribeSearch?.unsubscribe();
            subscribeNavigate?.unsubscribe();
            subscribeAccept?.unsubscribe();
        };
    }, []);

    const handleLiMouseEnter = (index: number) => {
        setActive(index);
    };

    const handleLiMouseLeave = () => {
        setActive(-1);
    };

    return (
        <Dropdown
            visible={visible}
            align={{ offset }}
            overlay={
                <ul className={styles.formulaSearchFunction}>
                    {searchList.map((item, index) => (
                        <li
                            key={index}
                            className={
                                active === index
                                    ? `${styles.formulaSearchFunctionItem} ${styles.formulaSearchFunctionItemActive}`
                                    : styles.formulaSearchFunctionItem
                            }
                            onMouseEnter={() => handleLiMouseEnter(index)}
                            onMouseLeave={handleLiMouseLeave}
                            onClick={() => promptService.acceptFormulaName(item.name)}
                        >
                            <span className={styles.formulaSearchFunctionItemName}>
                                <span className={styles.formulaSearchFunctionItemNameLight}>{searchText}</span>
                                <span>{item.name.slice(searchText.length)}</span>
                            </span>
                            <span className={styles.formulaSearchFunctionItemDesc}>{item.desc}</span>
                        </li>
                    ))}
                </ul>
            }
        >
            <span></span>
        </Dropdown>
    );
}

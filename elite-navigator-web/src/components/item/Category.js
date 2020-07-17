import React from 'react';
import Item from './Item';
import {IoMdArrowDropdown} from 'react-icons/all';

export default function Category(props) {
    const {name, detail, children} = props;
    
    return (
        <Item name={name} icon={<IoMdArrowDropdown/>} detail={detail}>
            {children}
        </Item>
    );
};

import { MouseEvent } from 'react';

export function toggleElementClasses(
    event: MouseEvent<HTMLSpanElement>,
    toggleClasses: string
) {
    const element = event.currentTarget;
    const classes = toggleClasses.split(' ').filter(cls => cls.trim() !== '');

    classes.forEach(cls => {
        element.classList.toggle(cls);
    });
}

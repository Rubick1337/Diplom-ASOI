'use client';
import Subcard from '@/shared/components/Subcard/Subcard';

export default function TestsCard() {
    return (
        <Subcard
            iconSrc="/images/SectionMainCards/Test.png"   // ← подставь свой файл
            iconAlt="Unit tests"
            title="Get instant feedback"
        >
            При решении каждого ката твой код проходит встроенные юнит-тесты. Запускай проверки
            столько, сколько нужно: видишь, что именно падает, исправляешь и повторяешь прогон —
            пока все тесты не станут зелёными.
        </Subcard>
    );
}

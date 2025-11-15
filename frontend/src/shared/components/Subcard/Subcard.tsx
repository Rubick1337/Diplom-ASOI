'use client';
import Image from 'next/image';
import '@/widgets/ChallengeSectionMain/ChallengeSectionMain.css';

type SubcardProps = {
    iconSrc: string;
    iconAlt: string;
    title: string;
    children: React.ReactNode;
};

export default function Subcard({ iconSrc, iconAlt, title, children }: SubcardProps) {
    return (
        <article className="subcard">
            <div className="subcard-head">
                <div className="subcard-icon" aria-hidden="true">
                    <Image
                        src={iconSrc}
                        alt={iconAlt}
                        width={30}
                        height={30}
                        className="subcard-icon-img"
                        priority
                    />
                </div>
                <h3 className="subcard-title">{title}</h3>
            </div>
            <p className="subcard-desc">{children}</p>
        </article>
    );
}

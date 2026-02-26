interface Props {
    message?: string;
    className?: string;
}

export function FullscreenLoader({ message = 'Loading...', className = '' }: Props) {
    return (
        <div className={`fullscreen-loader ${className}`}>
            <div className="fullscreen-loader__spinner" />
            <p className="fullscreen-loader__text">{message}</p>
        </div>
    );
}

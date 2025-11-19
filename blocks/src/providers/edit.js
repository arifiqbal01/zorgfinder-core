import ProvidersList from './components/ProvidersList';

export default function Edit() {
    return (
        <div className="zf-providers-block-editor">
            <ProvidersList isEditor={true} />
        </div>
    );
}

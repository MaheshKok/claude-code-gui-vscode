import React from "react";
import { Modal } from "./Modal";
import { UsageData } from "../UsageData";

interface UsageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Usage Data">
            <UsageData />
        </Modal>
    );
};

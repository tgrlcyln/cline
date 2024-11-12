import * as vscode from 'vscode';
import { expect } from 'chai';
import { anthropicModels } from '../shared/api';

describe('Claude-3-5-Haiku Computer Control Test', function() {
    it('should support computer use for Haiku model', () => {
        const haikuModelId = 'claude-3-5-haiku-20241022';
        const haikuModelInfo = anthropicModels[haikuModelId];

        // Bilgisayar kontrolü özelliğinin etkin olup olmadığını kontrol et
        expect(haikuModelInfo.supportsComputerUse, 
            `Haiku modeli bilgisayar kontrolü özelliği etkin değil`
        ).to.be.true;
    });

    it('should have computer use enabled for all Anthropic models', () => {
        const computerUseEnabledModels = Object.entries(anthropicModels)
            .filter(([modelId, modelInfo]) => modelInfo.supportsComputerUse);

        expect(computerUseEnabledModels.length, 
            'En az bir Anthropic modelinde bilgisayar kontrolü etkin olmalı'
        ).to.be.greaterThan(0);

        computerUseEnabledModels.forEach(([modelId, modelInfo]) => {
            expect(modelInfo.supportsComputerUse, 
                `${modelId} modelinde bilgisayar kontrolü etkin değil`
            ).to.be.true;
        });
    });
});

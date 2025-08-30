
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import * as governanceService from '../services/governanceService';
import { GovernanceRule } from '../types';

const GovernancePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { register, handleSubmit, formState: { errors }, reset } = useForm<{ rule: string }>();
    const [rules, setRules] = useState<GovernanceRule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        if (user?.governanceRules) {
            setRules(user.governanceRules);
        }
    }, [user]);

    const handleAddRule = async (data: { rule: string }) => {
        setIsLoading(true);
        setServerError('');
        try {
            const updatedRules = await governanceService.addRule(data.rule);
            setRules(updatedRules);
            updateUser({ governanceRules: updatedRules });
            reset();
        } catch (error: any) {
            setServerError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (window.confirm('Are you sure you want to delete this rule?')) {
            const updatedRules = await governanceService.deleteRule(ruleId);
            setRules(updatedRules);
            updateUser({ governanceRules: updatedRules });
        }
    };
    
    const handleToggleRule = async (ruleId: string, isActive: boolean) => {
        const updatedRules = await governanceService.updateRuleStatus(ruleId, isActive);
        setRules(updatedRules);
        updateUser({ governanceRules: updatedRules });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Data Governance</h1>

            <Card title="Manage Security Rules">
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Define natural language rules to constrain the AI. The AI will reject or modify queries that violate any active rule.
                </p>
                <div className="space-y-4">
                    {rules.length > 0 ? (
                        rules.map(rule => (
                            <div key={rule.id} className="p-4 border rounded-lg dark:border-gray-700 flex items-center justify-between">
                                <p className="text-gray-800 dark:text-gray-100">{rule.rule}</p>
                                <div className="flex items-center space-x-4">
                                     <label htmlFor={`toggle-${rule.id}`} className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input 
                                                type="checkbox" 
                                                id={`toggle-${rule.id}`} 
                                                className="sr-only" 
                                                checked={rule.isActive}
                                                onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                                            />
                                            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${rule.isActive ? 'transform translate-x-full bg-primary-600' : ''}`}></div>
                                        </div>
                                        <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                                            {rule.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </label>
                                    <Button onClick={() => handleDeleteRule(rule.id)} variant="danger" size="sm">Delete</Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No governance rules have been defined yet.</p>
                    )}
                </div>
            </Card>

            <Card title="Add New Rule">
                <form onSubmit={handleSubmit(handleAddRule)} noValidate className="space-y-4">
                    {serverError && <p className="text-red-500">{serverError}</p>}
                    <Input
                        id="rule"
                        label="Rule Description"
                        type="text"
                        {...register("rule", { required: "Rule cannot be empty" })}
                        error={errors.rule?.message}
                        placeholder="e.g., Block queries on the appointments table"
                    />
                    <Button type="submit" isLoading={isLoading}>Add Rule</Button>
                </form>
            </Card>
        </div>
    );
};

export default GovernancePage;
package com.githubmonitor.api.model;

import lombok.Getter;

@Getter
public enum AlertRuleType {
    HIGH_FREQUENCY_COMMITS(
        "Alta Frequência de Commits", 
        "Detecta anomalias de volume de commits em curto período",
        "{\"threshold\": 15, \"interval_minutes\": 10}"
    ),
    SENSITIVE_FILE_CHANGE(
        "Vazamento de Credenciais", 
        "Monitora arquivos sensíveis em commits",
        "{\"patterns\": [\".env\", \"id_rsa\", \"aws_access_key\", \"password.txt\"]}"
    ),
    DIRECT_PUSH_TO_MAIN(
        "Push Direto Proibido", 
        "Monitora violação de governança (commits diretos na main)",
        "{}"
    ),
    COMMIT_OUTSIDE_HOURS(
        "Commits Fora de Horário", 
        "Detecta commits realizados fora do horário comercial (08h às 18h)",
        "{\"start_hour\": 8, \"end_hour\": 18}"
    );

    private final String friendlyName;
    private final String description;
    private final String defaultParameters;

    AlertRuleType(String friendlyName, String description, String defaultParameters) {
        this.friendlyName = friendlyName;
        this.description = description;
        this.defaultParameters = defaultParameters;
    }
}

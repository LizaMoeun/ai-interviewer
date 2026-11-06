const CANDIDATE_REPORT_FIELDS = [
    "candidate_name",
    "job_title",
    "overall_score",
    "technical_evaluation",
    "communication_evaluation",
    "strengths",
    "weaknesses",
    "summary",
];

function toCandidateReport(report) {
    return CANDIDATE_REPORT_FIELDS.reduce((candidateReport, field) => {
        if (Object.prototype.hasOwnProperty.call(report, field)) {
            candidateReport[field] = report[field];
        }
        return candidateReport;
    }, {});
}

module.exports = { toCandidateReport };

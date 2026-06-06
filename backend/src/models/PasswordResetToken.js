import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class PasswordResetToken extends Model {
        static associate(models) {
            this.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
        }
    }

    PasswordResetToken.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            token: {
                type: DataTypes.STRING(64),
                allowNull: false,
                unique: true,
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'PasswordResetToken',
            tableName: 'password_reset_tokens',
            timestamps: true,
            paranoid: false,
            underscored: true,
            updatedAt: false,
        }
    );

    return PasswordResetToken;
};
